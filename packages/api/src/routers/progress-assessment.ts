import { db } from "@sarjy-sql/db";
import {
	attempt as attemptTable,
	exerciseQueueItem,
} from "@sarjy-sql/db/schema/practice";
import { exerciseProgress } from "@sarjy-sql/db/schema/progress";
import { and, desc, eq, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { recordGradedAttempt } from "../lib/learner-memory";
import { DISCARD_ATTEMPT_MS } from "../lib/mastery";
import { ATTEMPT_INPUT } from "./practice";

export const recordAssessmentAttempt = protectedProcedure
	.input(ATTEMPT_INPUT)
	.handler(async ({ context, input }) => {
		const userId = context.session.user.id;
		const kind = input.passed ? null : (input.kind ?? "wrong-values");
		const core = await db.transaction(async (tx) => {
			const [assignment] = await tx
				.select({
					id: exerciseQueueItem.id,
					concept: exerciseQueueItem.concept,
				})
				.from(exerciseQueueItem)
				.where(
					and(
						eq(exerciseQueueItem.userId, userId),
						eq(exerciseQueueItem.exerciseId, input.exerciseId),
						eq(exerciseQueueItem.status, "active"),
					),
				)
				.limit(1);
			if (!assignment || assignment.concept !== input.concept) {
				return { recorded: false as const, state: "not-active" as const };
			}
			if (input.passed) {
				const claimed = await tx
					.update(exerciseQueueItem)
					.set({ status: "passed", slot: null, resolvedAt: new Date() })
					.where(
						and(
							eq(exerciseQueueItem.id, assignment.id),
							eq(exerciseQueueItem.status, "active"),
						),
					)
					.returning({ id: exerciseQueueItem.id });
				if (claimed.length === 0) {
					return { recorded: false as const, state: "not-active" as const };
				}
			}
			if (input.elapsedMs < DISCARD_ATTEMPT_MS) {
				return { recorded: false as const, state: "too-fast" as const };
			}
			const [previous] = await tx
				.select({ ordinal: attemptTable.ordinal })
				.from(attemptTable)
				.where(
					and(
						eq(attemptTable.userId, userId),
						eq(attemptTable.exerciseId, input.exerciseId),
					),
				)
				.orderBy(desc(attemptTable.ordinal))
				.limit(1);
			const ordinal = (previous?.ordinal ?? 0) + 1;
			const now = new Date();
			await tx.insert(attemptTable).values({
				userId,
				exerciseId: input.exerciseId,
				concept: input.concept,
				sql: input.sql,
				passed: input.passed,
				kind,
				elapsedMs: input.elapsedMs,
				ordinal,
				predicted: input.predicted,
				hintShown: input.hintShown,
				gaveUp: input.gaveUp,
			});
			await tx
				.insert(exerciseProgress)
				.values({
					userId,
					exerciseId: input.exerciseId,
					attempts: 1,
					lastSql: input.sql,
					completedAt: input.passed ? now : null,
				})
				.onConflictDoUpdate({
					target: [exerciseProgress.userId, exerciseProgress.exerciseId],
					set: {
						attempts: sql`${exerciseProgress.attempts} + 1`,
						lastSql: input.sql,
						updatedAt: now,
						...(input.passed ? { completedAt: now } : {}),
					},
				});
			return { recorded: true as const, state: "recorded" as const, ordinal };
		});
		if (!core.recorded) return core;
		try {
			await recordGradedAttempt({
				userId,
				concept: input.concept,
				kind,
				sql: input.sql,
				elapsedMs: input.elapsedMs,
				ordinal: core.ordinal,
				hintShown: input.hintShown,
				gaveUp: input.gaveUp,
			});
		} catch (error) {
			console.error("[progress] learner-model cache update failed", error);
		}
		return core;
	});

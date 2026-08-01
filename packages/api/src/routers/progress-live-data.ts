import { db } from "@sarjy-sql/db";
import { attempt as attemptTable } from "@sarjy-sql/db/schema/practice";
import { exerciseProgress } from "@sarjy-sql/db/schema/progress";
import { and, desc, eq, sql } from "drizzle-orm";

import { protectedProcedure } from "../index";
import { LIVE_DATA_CHALLENGE_CONCEPT } from "../lib/assessment-catalog";
import { recordGradedAttempt } from "../lib/learner-memory";
import { DISCARD_ATTEMPT_MS } from "../lib/mastery";
import { ATTEMPT_INPUT } from "./practice";

export const recordLiveDataAttempt = protectedProcedure
	.input(ATTEMPT_INPUT)
	.handler(async ({ context, input }) => {
		const challengeId = input.exerciseId.split(":", 1)[0] ?? "";
		const concept = LIVE_DATA_CHALLENGE_CONCEPT.get(challengeId);
		if (!concept || concept !== input.concept) {
			return { recorded: false as const, state: "invalid-exercise" as const };
		}
		if (input.elapsedMs < DISCARD_ATTEMPT_MS) {
			return { recorded: false as const, state: "too-fast" as const };
		}
		const userId = context.session.user.id;
		const kind = input.passed ? null : (input.kind ?? "wrong-values");
		const core = await db.transaction(async (tx) => {
			const [progress] = await tx
				.select({ completedAt: exerciseProgress.completedAt })
				.from(exerciseProgress)
				.where(
					and(
						eq(exerciseProgress.userId, userId),
						eq(exerciseProgress.exerciseId, input.exerciseId),
					),
				)
				.limit(1);
			if (progress?.completedAt) {
				return { recorded: false as const, state: "already-passed" as const };
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
				concept,
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
				concept,
				kind,
				sql: input.sql,
				elapsedMs: input.elapsedMs,
				ordinal: core.ordinal,
				hintShown: input.hintShown,
				gaveUp: input.gaveUp,
			});
		} catch (error) {
			console.error("[progress] live-data learner cache update failed", error);
		}
		return core;
	});

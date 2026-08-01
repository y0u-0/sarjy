import { db } from "@sarjy-sql/db";
import {
	conceptMastery,
	type MisconceptionKind,
	misconception,
} from "@sarjy-sql/db/schema/memory";
import { and, eq } from "drizzle-orm";

import { reviewDueAt } from "./mastery";
import { profileFor } from "./practice-profile";

export interface GradedAttempt {
	userId: string;
	concept: string;
	kind: MisconceptionKind | null;
	sql: string;
	elapsedMs: number;
	ordinal: number;
	hintShown: boolean;
	gaveUp: boolean;
}

export async function recordGradedAttempt(
	attempt: GradedAttempt,
): Promise<void> {
	const passed = attempt.kind === null;
	const now = new Date();
	const [profile] = await profileFor(attempt.userId, [attempt.concept]);
	if (!profile) throw new Error("Could not rebuild the concept profile.");
	const failures = profile.opportunities - profile.passes;
	await db
		.insert(conceptMastery)
		.values({
			userId: attempt.userId,
			concept: attempt.concept,
			successes: profile.passes,
			failures,
			mastery: profile.mastery,
			lastSeenAt: now,
			reviewDueAt: reviewDueAt(profile.mastery, now),
		})
		.onConflictDoUpdate({
			target: [conceptMastery.userId, conceptMastery.concept],
			set: {
				successes: profile.passes,
				failures,
				mastery: profile.mastery,
				lastSeenAt: now,
				reviewDueAt: reviewDueAt(profile.mastery, now),
			},
		});
	if (passed) {
		await db
			.update(misconception)
			.set({ resolvedAt: now })
			.where(
				and(
					eq(misconception.userId, attempt.userId),
					eq(misconception.concept, attempt.concept),
				),
			);
		return;
	}
	await db
		.insert(misconception)
		.values({
			userId: attempt.userId,
			concept: attempt.concept,
			kind: attempt.kind as MisconceptionKind,
			lastSql: attempt.sql,
			lastSeenAt: now,
		})
		.onConflictDoUpdate({
			target: [misconception.userId, misconception.concept, misconception.kind],
			set: {
				count:
					profile.mistakes.find((row) => row.kind === attempt.kind)?.count ?? 1,
				lastSql: attempt.sql,
				lastSeenAt: now,
				resolvedAt: null,
			},
		});
}

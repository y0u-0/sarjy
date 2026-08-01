import { db } from "@sarjy-sql/db";
import { exerciseUnlock } from "@sarjy-sql/db/schema/practice";
import { and, asc, eq } from "drizzle-orm";

export async function unlockExercises(params: {
	userId: string;
	concept: string;
	candidateIds: string[];
	count: number;
	reason: string;
}): Promise<string[]> {
	if (params.count <= 0) return [];
	const already = new Set(
		(
			await db
				.select({ exerciseId: exerciseUnlock.exerciseId })
				.from(exerciseUnlock)
				.where(
					and(
						eq(exerciseUnlock.userId, params.userId),
						eq(exerciseUnlock.concept, params.concept),
					),
				)
		).map((row) => row.exerciseId),
	);
	const fresh = params.candidateIds
		.filter((id) => !already.has(id))
		.slice(0, params.count);
	if (fresh.length === 0) return [];
	await db.insert(exerciseUnlock).values(
		fresh.map((exerciseId) => ({
			userId: params.userId,
			concept: params.concept,
			exerciseId,
			reason: params.reason,
		})),
	);
	return fresh;
}

export async function unlockedFor(userId: string, concept: string) {
	return db
		.select({
			exerciseId: exerciseUnlock.exerciseId,
			reason: exerciseUnlock.reason,
		})
		.from(exerciseUnlock)
		.where(
			and(
				eq(exerciseUnlock.userId, userId),
				eq(exerciseUnlock.concept, concept),
			),
		)
		.orderBy(asc(exerciseUnlock.createdAt));
}

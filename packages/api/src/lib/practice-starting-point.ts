import { db } from "@sarjy-sql/db";
import {
	attempt,
	exerciseQueueItem,
	practiceStartingPoint,
	type StartingPointLevel,
	type StartingPointSource,
} from "@sarjy-sql/db/schema/practice";
import { and, eq } from "drizzle-orm";

export interface SavedStartingPoint {
	level: StartingPointLevel;
	source: StartingPointSource;
	rationale: string;
}

export type StartingPointState =
	| { kind: "interview" }
	| ({ kind: "ready" } & SavedStartingPoint)
	| {
			kind: "ready";
			level: null;
			source: null;
			rationale: null;
	  };

async function savedStartingPointFor(
	userId: string,
): Promise<SavedStartingPoint | null> {
	const [row] = await db
		.select({
			level: practiceStartingPoint.level,
			source: practiceStartingPoint.source,
			rationale: practiceStartingPoint.rationale,
		})
		.from(practiceStartingPoint)
		.where(eq(practiceStartingPoint.userId, userId))
		.limit(1);
	return row ?? null;
}

async function hasSuccessfulPractice(userId: string): Promise<boolean> {
	const [passedAttempt, passedQueueItem] = await Promise.all([
		db
			.select({ id: attempt.id })
			.from(attempt)
			.where(and(eq(attempt.userId, userId), eq(attempt.passed, true)))
			.limit(1),
		db
			.select({ id: exerciseQueueItem.id })
			.from(exerciseQueueItem)
			.where(
				and(
					eq(exerciseQueueItem.userId, userId),
					eq(exerciseQueueItem.status, "passed"),
				),
			)
			.limit(1),
	]);
	return passedAttempt.length > 0 || passedQueueItem.length > 0;
}

export async function startingPointStateFor(
	userId: string,
): Promise<StartingPointState> {
	const saved = await savedStartingPointFor(userId);
	if (saved) return { kind: "ready", ...saved };
	if (await hasSuccessfulPractice(userId)) {
		return { kind: "ready", level: null, source: null, rationale: null };
	}
	return { kind: "interview" };
}

export async function saveStartingPoint(params: {
	userId: string;
	level: StartingPointLevel;
	source: StartingPointSource;
	rationale: string;
}): Promise<{ startingPoint: SavedStartingPoint; created: boolean }> {
	const inserted = await db.transaction(async (tx) => {
		const rows = await tx
			.insert(practiceStartingPoint)
			.values(params)
			.onConflictDoNothing()
			.returning({ userId: practiceStartingPoint.userId });
		if (rows.length > 0) {
			await tx
				.update(exerciseQueueItem)
				.set({ status: "retired", slot: null, resolvedAt: new Date() })
				.where(
					and(
						eq(exerciseQueueItem.userId, params.userId),
						eq(exerciseQueueItem.status, "active"),
					),
				);
		}
		return rows.length > 0;
	});
	const startingPoint = await savedStartingPointFor(params.userId);
	if (!startingPoint) {
		throw new Error("Could not persist the learner starting point.");
	}
	return { startingPoint, created: inserted };
}

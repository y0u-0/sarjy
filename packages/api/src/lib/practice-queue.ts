import { db } from "@sarjy-sql/db";
import {
	type ExerciseQueueStatus,
	exerciseQueueItem,
} from "@sarjy-sql/db/schema/practice";
import { and, asc, eq } from "drizzle-orm";

import {
	type ActiveQueueCandidate,
	ASSESSMENT_QUEUE_SIZE,
	type QueueCandidate,
	selectQueueCandidate,
} from "./exercise-queue";
import { conceptSignalsFor } from "./practice-signals";

const SPACED_REVIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface ActiveExerciseQueueItem {
	exerciseId: string;
	concept: string;
	difficulty: number;
	slot: number;
	selectionReason: string;
}

interface StoredQueueItem extends ActiveExerciseQueueItem {
	id: number;
	status: ExerciseQueueStatus;
	resolvedAt: Date | null;
}

async function queueHistoryFor(userId: string): Promise<StoredQueueItem[]> {
	const rows = await db
		.select({
			id: exerciseQueueItem.id,
			exerciseId: exerciseQueueItem.exerciseId,
			concept: exerciseQueueItem.concept,
			difficulty: exerciseQueueItem.difficulty,
			slot: exerciseQueueItem.slot,
			status: exerciseQueueItem.status,
			selectionReason: exerciseQueueItem.selectionReason,
			resolvedAt: exerciseQueueItem.resolvedAt,
		})
		.from(exerciseQueueItem)
		.where(eq(exerciseQueueItem.userId, userId))
		.orderBy(asc(exerciseQueueItem.assignedAt), asc(exerciseQueueItem.id));
	return rows.map((row) => ({ ...row, slot: row.slot ?? -1 }));
}

function activeQueue(rows: StoredQueueItem[]): ActiveExerciseQueueItem[] {
	return rows
		.filter(
			(row): row is StoredQueueItem & { slot: number } =>
				row.status === "active" && row.slot >= 0,
		)
		.sort((left, right) => left.slot - right.slot)
		.map(({ exerciseId, concept, difficulty, slot, selectionReason }) => ({
			exerciseId,
			concept,
			difficulty,
			slot,
			selectionReason,
		}));
}

function isQueueConstraintRace(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	const code =
		"code" in error && typeof error.code === "string" ? error.code : "";
	return (
		code === "SQLITE_CONSTRAINT" ||
		code === "SQLITE_CONSTRAINT_UNIQUE" ||
		error.message.includes("UNIQUE constraint failed")
	);
}

function skipPressure(history: StoredQueueItem[]): Map<string, number> {
	const skipped = new Map<string, number>();
	for (const row of history) {
		const pressure = skipped.get(row.concept) ?? 0;
		if (row.status === "skipped") skipped.set(row.concept, pressure + 1);
		else if (row.status === "passed" && pressure > 0)
			skipped.set(row.concept, pressure - 1);
	}
	return skipped;
}

async function storeSelection(params: {
	userId: string;
	slot: number;
	history: StoredQueueItem[];
	selection: ReturnType<typeof selectQueueCandidate> & {};
}) {
	const previous = params.history.find(
		(row) => row.exerciseId === params.selection.candidate.id,
	);
	if (previous) {
		await db
			.update(exerciseQueueItem)
			.set({
				concept: params.selection.candidate.concept,
				difficulty: params.selection.candidate.difficulty,
				slot: params.slot,
				status: "active",
				selectionReason: params.selection.reason,
				assignedAt: new Date(),
				resolvedAt: null,
			})
			.where(eq(exerciseQueueItem.id, previous.id));
		return;
	}
	await db
		.insert(exerciseQueueItem)
		.values({
			userId: params.userId,
			exerciseId: params.selection.candidate.id,
			concept: params.selection.candidate.concept,
			difficulty: params.selection.candidate.difficulty,
			slot: params.slot,
			status: "active",
			selectionReason: params.selection.reason,
		})
		.onConflictDoNothing();
}

export async function ensureExerciseQueue(params: {
	userId: string;
	candidates: QueueCandidate[];
	selectionReason?: string;
}): Promise<ActiveExerciseQueueItem[]> {
	const catalog = new Map(params.candidates.map((item) => [item.id, item]));
	const candidates = [...catalog.values()];
	const concepts = [...new Set(candidates.map((item) => item.concept))];
	const evidence = await Promise.all(
		concepts.map((concept) => conceptSignalsFor(params.userId, concept)),
	);
	for (let pass = 0; pass < ASSESSMENT_QUEUE_SIZE * 3; pass += 1) {
		const history = await queueHistoryFor(params.userId);
		const stale = history.filter(
			(row) => row.status === "active" && !catalog.has(row.exerciseId),
		);
		if (stale.length > 0) {
			await Promise.all(
				stale.map((row) =>
					db
						.update(exerciseQueueItem)
						.set({ status: "retired", slot: null, resolvedAt: new Date() })
						.where(eq(exerciseQueueItem.id, row.id)),
				),
			);
			continue;
		}
		const active = activeQueue(history);
		if (active.length >= ASSESSMENT_QUEUE_SIZE) return active;
		const occupied = new Set(active.map((row) => row.slot));
		const slot = [0, 1, 2].find((value) => !occupied.has(value));
		if (slot === undefined) return active;
		const selection = selectQueueCandidate({
			candidates,
			assignedIds: new Set(history.map((row) => row.exerciseId)),
			active: active.map(
				(row): ActiveQueueCandidate => ({
					id: row.exerciseId,
					concept: row.concept,
					difficulty: row.difficulty,
					slot: row.slot,
				}),
			),
			evidence,
			skippedByConcept: skipPressure(history),
			recentlyResolvedIds: new Set(
				history
					.filter(
						(row) =>
							row.resolvedAt &&
							Date.now() - row.resolvedAt.getTime() < SPACED_REVIEW_COOLDOWN_MS,
					)
					.map((row) => row.exerciseId),
			),
			slot,
		});
		if (!selection) return active;
		try {
			await storeSelection({
				userId: params.userId,
				slot,
				history,
				selection: params.selectionReason
					? { ...selection, reason: params.selectionReason }
					: selection,
			});
		} catch (error) {
			if (!isQueueConstraintRace(error)) throw error;
		}
	}
	const active = activeQueue(await queueHistoryFor(params.userId));
	if (active.length < Math.min(ASSESSMENT_QUEUE_SIZE, candidates.length)) {
		throw new Error("Could not fill the adaptive exercise queue.");
	}
	return active;
}

export async function resolveAssignedExercise(params: {
	userId: string;
	exerciseId: string;
	status: "passed" | "skipped";
}): Promise<boolean> {
	const resolved = await db
		.update(exerciseQueueItem)
		.set({ status: params.status, slot: null, resolvedAt: new Date() })
		.where(
			and(
				eq(exerciseQueueItem.userId, params.userId),
				eq(exerciseQueueItem.exerciseId, params.exerciseId),
				eq(exerciseQueueItem.status, "active"),
			),
		)
		.returning({ id: exerciseQueueItem.id });
	return resolved.length > 0;
}

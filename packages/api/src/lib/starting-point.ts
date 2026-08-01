import type { StartingPointLevel } from "@sarjy-sql/db/schema/practice";

import type { QueueCandidate } from "./exercise-queue";

export type { StartingPointLevel } from "@sarjy-sql/db/schema/practice";

export const STARTING_POINT_LABELS = {
	new: "New to SQL",
	foundations: "Building foundations",
	intermediate: "Working knowledge",
	advanced: "Advanced practice",
} as const satisfies Record<StartingPointLevel, string>;

export function isStartingPointLevel(
	value: string,
): value is StartingPointLevel {
	return Object.hasOwn(STARTING_POINT_LABELS, value);
}

const CONCEPTS_BY_LEVEL = {
	new: new Set(["select-basics"]),
	foundations: new Set([
		"filtering-sorting",
		"aggregates",
		"joins",
		"expressions",
	]),
	intermediate: new Set([
		"aggregates",
		"joins",
		"subqueries",
		"expressions",
		"null-handling",
		"set-operations",
		"self-joins",
		"advanced-aggregation",
		"ctes",
	]),
	advanced: new Set([
		"advanced-aggregation",
		"ctes",
		"correlated-subqueries",
		"window-ranking",
		"window-analytics",
		"date-text-analysis",
		"business-analytics",
	]),
} as const satisfies Record<StartingPointLevel, ReadonlySet<string>>;

const DIFFICULTY_RANGE = {
	new: { min: 0, max: 1 },
	foundations: { min: 0, max: 2 },
	intermediate: { min: 1, max: 2 },
	advanced: { min: 1, max: 3 },
} as const satisfies Record<StartingPointLevel, { min: number; max: number }>;

/** The first set samples three concepts near the interview estimate. */
export function candidatesForStartingPoint(
	candidates: QueueCandidate[],
	level: StartingPointLevel,
): QueueCandidate[] {
	const concepts = CONCEPTS_BY_LEVEL[level];
	const range = DIFFICULTY_RANGE[level];
	return candidates.filter(
		(candidate) =>
			concepts.has(candidate.concept) &&
			candidate.difficulty >= range.min &&
			candidate.difficulty <= range.max,
	);
}

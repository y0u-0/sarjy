import { describe, expect, test } from "bun:test";

import { ASSESSMENT_CANDIDATES } from "./assessment-catalog";
import type { QueueCandidate } from "./exercise-queue";
import {
	candidatesForStartingPoint,
	STARTING_POINT_LABELS,
} from "./starting-point";

const candidates: QueueCandidate[] = [
	{ id: "select-0", concept: "select-basics", difficulty: 0 },
	{ id: "select-2", concept: "select-basics", difficulty: 2 },
	{ id: "filter-1", concept: "filtering-sorting", difficulty: 1 },
	{ id: "aggregate-1", concept: "aggregates", difficulty: 1 },
	{ id: "join-1", concept: "joins", difficulty: 1 },
	{ id: "subquery-2", concept: "subqueries", difficulty: 2 },
	{ id: "cte-1", concept: "ctes", difficulty: 1 },
	{ id: "window-1", concept: "window-analytics", difficulty: 1 },
	{ id: "business-3", concept: "business-analytics", difficulty: 3 },
];

describe("starting-point candidate bands", () => {
	test("keeps a new learner on introductory concepts and question shapes", () => {
		expect(
			candidatesForStartingPoint(candidates, "new").map(
				(candidate) => candidate.id,
			),
		).toEqual(["select-0"]);
	});

	test("has enough genuinely basic questions for the first three cards", () => {
		const selected = candidatesForStartingPoint(ASSESSMENT_CANDIDATES, "new");
		expect(selected.length).toBeGreaterThanOrEqual(3);
		expect(
			selected.every(
				(candidate) =>
					candidate.concept === "select-basics" && candidate.difficulty <= 1,
			),
		).toBe(true);
	});

	test("moves working learners toward joins, subqueries, and CTEs", () => {
		const selected = candidatesForStartingPoint(candidates, "intermediate");
		expect(selected.map((candidate) => candidate.id)).toEqual([
			"aggregate-1",
			"join-1",
			"subquery-2",
			"cte-1",
		]);
	});

	test("keeps advanced placement on advanced analytical concepts", () => {
		expect(
			candidatesForStartingPoint(candidates, "advanced").map(
				(candidate) => candidate.id,
			),
		).toEqual(["cte-1", "window-1", "business-3"]);
	});

	test("has learner-facing copy for every accepted level", () => {
		expect(Object.keys(STARTING_POINT_LABELS)).toEqual([
			"new",
			"foundations",
			"intermediate",
			"advanced",
		]);
	});
});

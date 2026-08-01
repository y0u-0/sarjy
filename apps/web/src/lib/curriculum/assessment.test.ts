import { expect, test } from "bun:test";
import {
	ASSESSMENT_CANDIDATES,
	LIVE_DATA_CHALLENGE_CONCEPT,
	OPTIMIZATION_EXERCISE_CONCEPT,
} from "@sarjy-sql/api/lib/assessment-catalog";

import { lessons } from "./lessons";
import { optimizationProblemBank } from "./optimization-bank";
import { practicePool } from "./practice-pool";
import { difficultyTier } from "./types";

const tierNumber = {
	easy: 0,
	medium: 1,
	hard: 2,
	extra: 3,
} as const;

test("the server-owned assessment catalog matches every authored question", () => {
	const authored = [
		...lessons.flatMap((lesson) =>
			lesson.exercises.map((exercise, index) => ({
				id: exercise.id,
				concept: lesson.id,
				difficulty: Math.min(index, 3),
			})),
		),
		...Object.values(practicePool).flatMap((exercises) =>
			exercises.map((exercise) => ({
				id: exercise.id,
				concept: exercise.concept,
				difficulty: tierNumber[difficultyTier(exercise.complexity)],
			})),
		),
	];

	expect(new Map(ASSESSMENT_CANDIDATES.map((item) => [item.id, item]))).toEqual(
		new Map(authored.map((item) => [item.id, item])),
	);
	expect(new Set(ASSESSMENT_CANDIDATES.map((item) => item.id)).size).toBe(
		ASSESSMENT_CANDIDATES.length,
	);
	expect(ASSESSMENT_CANDIDATES.length).toBeGreaterThanOrEqual(200);
});

test("live-data grading accepts only the three authored challenge concepts", () => {
	expect([...LIVE_DATA_CHALLENGE_CONCEPT]).toEqual([
		["live-weather-hottest-hours", "filtering-sorting"],
		["live-weather-city-summary", "advanced-aggregation"],
		["live-weather-moving-average", "window-analytics"],
	]);
});

test("every concept has repeated practice instead of a one-off question", () => {
	for (const lesson of lessons) {
		const heldBack = practicePool[lesson.id] ?? [];
		expect(lesson.exercises.length).toBeGreaterThanOrEqual(2);
		expect(heldBack.length).toBeGreaterThanOrEqual(2);
		expect(lesson.exercises.length + heldBack.length).toBeGreaterThanOrEqual(4);
	}
});

test("the server accepts evidence from every authored optimization problem", () => {
	const authored: [string, string][] = optimizationProblemBank.map(
		(problem) => [`opt-${problem.id}`, problem.concept],
	);

	expect([...OPTIMIZATION_EXERCISE_CONCEPT]).toEqual(authored);
	expect(optimizationProblemBank).toHaveLength(19);
	expect(
		optimizationProblemBank.some(
			(problem) =>
				problem.mode === "rewrite" &&
				problem.technique === "ctas" &&
				/CREATE\s+(?:TEMP\s+)?TABLE[\s\S]+\sAS\s+SELECT/i.test(
					problem.solutionSql,
				),
		),
	).toBe(true);
});

import { expandedPracticePool } from "./expanded-practice-pool";
import { aggregatesPractice } from "./practice-aggregates";
import { expressionsPractice } from "./practice-expressions";
import { filteringSortingPractice } from "./practice-filtering-sorting";
import { joinsPractice } from "./practice-joins";
import { selectBasicsPractice } from "./practice-select-basics";
import { subqueriesPractice } from "./practice-subqueries";
import type { PoolExercise } from "./types";

const authored = {
	...selectBasicsPractice,
	...filteringSortingPractice,
	...aggregatesPractice,
	...joinsPractice,
	...subqueriesPractice,
	...expressionsPractice,
};

export const practicePool: Record<string, PoolExercise[]> = Object.fromEntries(
	Object.entries({ ...authored, ...expandedPracticePool }).map(
		([concept, list]) => [
			concept,
			list.map((exercise) => ({ ...exercise, concept })),
		],
	),
);

export function poolFor(concept: string): PoolExercise[] {
	return practicePool[concept] ?? [];
}

const byId = new Map<string, PoolExercise>(
	Object.values(practicePool).flatMap((list) =>
		list.map((exercise) => [exercise.id, exercise] as const),
	),
);

export function poolExerciseById(id: string): PoolExercise | undefined {
	return byId.get(id);
}

/**
 * How rare each SQL construct is across the whole pool.
 *
 * Counting concepts equally makes a self-join score the same as an ordinary
 * two-table join, which is badly wrong — the self-join is the hardest query type in
 * every published difficulty ordering, with 76% of students failing it. Weighting
 * by inverse document frequency fixes that from the data instead of by hand: a
 * construct that appears once in 43 exercises is rare and therefore hard, while
 * `restriction` appears nearly everywhere and carries almost no information.
 *
 * This is Pelánek's recommended aggregation for concept-based complexity, and the
 * one that reached Spearman ~0.9 against measured solving time for programming
 * tasks.
 */
const conceptIdf = buildConceptIdf();

function buildConceptIdf(): Map<string, number> {
	const all = Object.values(practicePool).flat();
	const documentCount = all.length;
	const occurrences = new Map<string, number>();

	for (const exercise of all) {
		for (const name of new Set(exercise.complexity.concepts)) {
			occurrences.set(name, (occurrences.get(name) ?? 0) + 1);
		}
	}

	return new Map(
		[...occurrences].map(([name, count]) => [
			name,
			Math.log(documentCount / count),
		]),
	);
}

/**
 * Pool ids for a concept, easiest first, so unlocking the first N opens the
 * gentlest ones. Ordering is derived rather than authored — authors asked to rate
 * the difficulty of their own items are right about 41% of the time, and
 * overestimate it in 48%.
 */
export function poolIdsByDifficulty(concept: string): string[] {
	return [...poolFor(concept)]
		.sort((a, b) => complexityScore(a) - complexityScore(b))
		.map((exercise) => exercise.id);
}

export function complexityScore(exercise: PoolExercise): number {
	const { tables, clauses, nestingDepth, concepts } = exercise.complexity;
	const conceptWeight = concepts.reduce(
		(total, name) => total + (conceptIdf.get(name) ?? 0),
		0,
	);
	return tables + clauses + nestingDepth * 2 + conceptWeight;
}

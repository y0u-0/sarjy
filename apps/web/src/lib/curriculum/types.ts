export interface Exercise {
	id: string;
	title: string;
	prompt: string;
	hint: string;
	referenceSql: string;
	ordered: boolean;
}

export interface Lesson {
	id: string;
	title: string;
	summary: string;
	concept: string;
	exercises: Exercise[];
}

export interface ExerciseWithLesson {
	exercise: Exercise;
	lesson: Lesson;
	index: number;
	total: number;
	/**
	 * Non-null when this is held-back practice rather than part of the numbered
	 * curriculum. `index` and `total` are meaningless in that case — the pool has no
	 * position and deliberately exposes no count.
	 */
	poolVariant: PoolVariant | null;
	previousId: string | null;
	nextId: string | null;
}

/**
 * Why a held-back exercise exists. A pool of near-identical clones teaches the
 * surface pattern rather than the concept, so each concept's pool spans three
 * purposes instead of one.
 *
 * - `surface` varies the schema and wording while holding the query shape fixed,
 *   which is what lets a learner see that GROUP BY is about grouping and not
 *   about the table it was first met on.
 * - `neighbour` is an adjacent, confusable concept, so the learner has to decide
 *   which tool applies rather than execute the one they were just shown. A block
 *   of same-shaped problems deletes that decision entirely.
 * - `trap` has its data arranged so that the most persistent error on this
 *   concept returns a visibly wrong result table, making the mistake
 *   self-evident instead of needing to be asserted.
 */
export const POOL_VARIANTS = ["surface", "neighbour", "trap"] as const;

export type PoolVariant = (typeof POOL_VARIANTS)[number];

/**
 * Structural properties of an exercise, computable from the exercise alone.
 *
 * Complexity is not difficulty — difficulty is a property of the student-task
 * interaction and needs roughly 100 learners per item to estimate. Complexity is
 * authorable on day one and is the standard stand-in for difficulty while an item
 * has no data. Authors asked to rate difficulty directly are right about 41% of
 * the time, so nothing here asks for a rating.
 */
export interface ComplexityVector {
	tables: number;
	/** How many of SELECT/FROM/WHERE/GROUP BY/HAVING/ORDER BY/LIMIT appear. */
	clauses: number;
	nestingDepth: number;
	solutionTokens: number;
	concepts: string[];
}

export interface PoolExercise extends Exercise {
	variant: PoolVariant;
	complexity: ComplexityVector;
	/**
	 * The lesson this belongs to. Filled in from the pool's own keys at module load
	 * rather than authored per exercise, so it cannot drift out of sync.
	 */
	concept: string;
	/**
	 * Taipalus error IDs this item is built to expose, for `trap` variants. Used to
	 * explain the trap after the fact, never to pre-warn — telling a learner which
	 * constructs an exercise needs is the intuitive fix for procedural fixedness
	 * and it is the wrong one.
	 */
	exposes?: string[];
}

/**
 * Ordered coarse tiers, derived from the complexity vector rather than authored.
 * Mirrors how Spider labels SQL difficulty: count the components, don't guess.
 */
export const DIFFICULTY_TIERS = ["easy", "medium", "hard", "extra"] as const;

export type DifficultyTier = (typeof DIFFICULTY_TIERS)[number];

/**
 * Bands start at 6 rather than 0 because the score has a floor: every query has at
 * least one table, a SELECT and a FROM, and one concept. Nesting is doubled because
 * a subquery is where the measured difficulty of SQL actually jumps — correlated
 * subqueries and self-joins sit at the top of every published difficulty ordering,
 * with 76% of students failing the self-join.
 */
export function difficultyTier(complexity: ComplexityVector): DifficultyTier {
	const score =
		complexity.tables +
		complexity.clauses +
		complexity.nestingDepth * 2 +
		complexity.concepts.length;

	if (score <= 6) return "easy";
	if (score <= 9) return "medium";
	if (score <= 13) return "hard";
	return "extra";
}

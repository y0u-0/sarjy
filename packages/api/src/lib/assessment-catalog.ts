import {
	CORE_LESSON_CANDIDATES,
	CORE_POOL_CANDIDATES,
} from "./assessment-catalog-core";
import { EXPANDED_LESSON_CANDIDATES } from "./assessment-catalog-expanded-lessons";
import { EXPANDED_POOL_CANDIDATES } from "./assessment-catalog-expanded-pool";
import { OPTIMIZATION_EXERCISE_CONCEPT } from "./assessment-catalog-playgrounds";
import type { QueueCandidate } from "./exercise-queue";

export {
	LIVE_DATA_CHALLENGE_CONCEPT,
	OPTIMIZATION_EXERCISE_CONCEPT,
} from "./assessment-catalog-playgrounds";

/** Private server-owned assignments, kept in stable curriculum order. */
export const ASSESSMENT_CANDIDATES: QueueCandidate[] = [
	...CORE_LESSON_CANDIDATES,
	...EXPANDED_LESSON_CANDIDATES,
	...CORE_POOL_CANDIDATES,
	...EXPANDED_POOL_CANDIDATES,
];

/** Concepts the voice agent may attach explicit, student-authored signals to. */
export const LEARNER_CONCEPTS = new Set([
	...ASSESSMENT_CANDIDATES.map((candidate) => candidate.concept),
	...OPTIMIZATION_EXERCISE_CONCEPT.values(),
]);

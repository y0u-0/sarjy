import { ADVANCED_INDEX_PROBLEMS } from "./optimization-problems-advanced";
import { CORE_INDEX_PROBLEMS } from "./optimization-problems-core";
import type { OptimizationProblem } from "./optimization-types";

export { LAB_DDL, LAB_SCHEMA_SUMMARY } from "./optimization-schema";
export type {
	Illustration,
	IndexSuggestion,
	OptimizationProblem,
} from "./optimization-types";

export const optimizationProblems: OptimizationProblem[] = [
	...CORE_INDEX_PROBLEMS,
	...ADVANCED_INDEX_PROBLEMS,
];

export function findProblem(id: string): OptimizationProblem | undefined {
	return optimizationProblems.find((problem) => problem.id === id);
}

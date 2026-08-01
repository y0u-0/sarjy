import { optimizationProblems } from "./optimization";
import {
	CTAS_REUSE_PROBLEM,
	indexProblem,
	rewriteProblem,
} from "./optimization-bank-builders";
import type { OptimizationLabProblem } from "./optimization-bank-types";
import { rewriteChallenges } from "./rewrites";

export type {
	IndexOptimizationProblem,
	OptimizationDatasetId,
	OptimizationLabProblem,
	PlanSuccessCriterion,
	RewriteOptimizationProblem,
	RewriteSuccessCriterion,
} from "./optimization-bank-types";
export { optimizationDatasets } from "./optimization-datasets";

export const optimizationProblemBank: OptimizationLabProblem[] = [
	...optimizationProblems.map(indexProblem),
	...rewriteChallenges.map(rewriteProblem),
	CTAS_REUSE_PROBLEM,
];

export const optimizationConcepts = [
	...new Map(
		optimizationProblemBank.map((problem) => [
			problem.concept,
			{ id: problem.concept, title: problem.conceptLabel },
		]),
	).values(),
];

export function findOptimizationProblem(
	id: string,
): OptimizationLabProblem | undefined {
	return optimizationProblemBank.find((problem) => problem.id === id);
}

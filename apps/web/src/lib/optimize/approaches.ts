import type { OptimizationLabProblem } from "../curriculum/optimization-bank";

import { ACCESS_APPROACHES } from "./approach-data-access";
import { EARLY_REWRITE_APPROACHES } from "./approach-data-early-rewrites";
import { JOIN_APPROACHES } from "./approach-data-joins";
import { LATER_REWRITE_APPROACHES } from "./approach-data-later-rewrites";

export type ApproachFit = "best" | "viable" | "situational" | "poor";

export interface OptimizationApproach {
	technique:
		| "Index"
		| "Composite index"
		| "Rewrite"
		| "Subquery"
		| "CTE"
		| "CTAS";
	title: string;
	fit: ApproachFit;
	effect: string;
	tradeoff: string;
}

const APPROACHES: Record<string, OptimizationApproach[]> = {
	...ACCESS_APPROACHES,
	...JOIN_APPROACHES,
	...EARLY_REWRITE_APPROACHES,
	...LATER_REWRITE_APPROACHES,
};

export function approachesForProblem(
	problem: OptimizationLabProblem,
): readonly OptimizationApproach[] {
	const approaches = APPROACHES[problem.id];
	if (!approaches) {
		throw new Error(`Missing optimization approaches for ${problem.id}`);
	}
	return approaches;
}

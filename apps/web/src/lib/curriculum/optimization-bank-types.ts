import type { OptimizationProblem as IndexSourceProblem } from "./optimization";
import type { ComplexityVector } from "./types";

export type OptimizationDatasetId = "lab" | "record-shop-large";

export interface PlanSuccessCriterion {
	kind: "plan";
	maxSorts?: number;
	maxFullScanSteps?: number;
	minIndexedSteps?: number;
	requireCoveringIndex?: boolean;
}

export interface RewriteSuccessCriterion {
	kind: "rewrite";
	minimumSpeedup: number;
	allowResultChange: boolean;
}

interface OptimizationProblemBase {
	id: string;
	title: string;
	prompt: string;
	concept: string;
	conceptLabel: string;
	datasetId: OptimizationDatasetId;
	complexity: ComplexityVector;
	predictHint: string;
}

export interface IndexOptimizationProblem extends OptimizationProblemBase {
	mode: "index";
	querySql: string;
	goal: string;
	illustration: IndexSourceProblem["illustration"];
	solutions: IndexSourceProblem["suggestions"];
	success: PlanSuccessCriterion;
}

export interface RewriteOptimizationProblem extends OptimizationProblemBase {
	mode: "rewrite";
	technique: "rewrite" | "ctas";
	baselineSql: string;
	solutionSql: string;
	nudges: string[];
	explanation: string;
	caveat?: string;
	indexes: string[];
	success: RewriteSuccessCriterion;
}

export type OptimizationLabProblem =
	| IndexOptimizationProblem
	| RewriteOptimizationProblem;

import type { MisconceptionKind } from "@sarjy-sql/api/lib/practice-policy";

import type {
	IndexOptimizationProblem,
	RewriteOptimizationProblem,
} from "@/lib/curriculum/optimization-bank";
import type {
	CompareResponse,
	OptimizeResponse,
	WorkCounters,
} from "@/lib/sql-engine/types";

export interface OptimizationOutcome {
	passed: boolean;
	kind: MisconceptionKind | null;
	reason: string;
	speedup: number | null;
}

export function hasDeterministicWorkImprovement(
	before: WorkCounters | null,
	after: WorkCounters | null,
): boolean {
	return Boolean(
		before &&
			after &&
			((before.fullScanSteps > 0 &&
				after.fullScanSteps < before.fullScanSteps * 0.9) ||
				after.sorts < before.sorts ||
				after.autoIndexRows < before.autoIndexRows ||
				(!before.vmStepsOverflowed &&
					!after.vmStepsOverflowed &&
					after.vmSteps < before.vmSteps * 0.85)),
	);
}

export function evaluateIndexAttempt(
	problem: IndexOptimizationProblem,
	response: OptimizeResponse,
): OptimizationOutcome {
	const { success } = problem;
	const work = response.benchmark.work;
	const misses: string[] = [];

	if (success.maxFullScanSteps !== undefined) {
		if (!work) {
			misses.push("the engine did not return scan counters");
		} else if (work.fullScanSteps > success.maxFullScanSteps) {
			misses.push(
				`SQLite still reports ${work.fullScanSteps.toLocaleString()} full-scan steps`,
			);
		}
	}

	if (success.maxSorts !== undefined) {
		const sorts = work?.sorts ?? response.plan.temporaryBTrees;
		if (sorts > success.maxSorts) {
			misses.push("the temporary sort is still in the plan");
		}
	}

	if (
		success.minIndexedSteps !== undefined &&
		response.plan.indexedCount < success.minIndexedSteps
	) {
		misses.push("SQLite still has no useful indexed access step");
	}

	if (
		success.requireCoveringIndex &&
		!response.plan.flat.some((node) => /\bCOVERING INDEX\b/i.test(node.detail))
	) {
		misses.push("the plan still has to open the table after reading the index");
	}

	return misses.length === 0
		? {
				passed: true,
				kind: null,
				reason: "The change meets every measured plan goal for this problem.",
				speedup: null,
			}
		: {
				passed: false,
				kind: "no-plan-improvement",
				reason: `Not there yet: ${misses.join("; ")}.`,
				speedup: null,
			};
}

export function evaluateRewriteAttempt(
	problem: RewriteOptimizationProblem,
	response: CompareResponse,
): OptimizationOutcome {
	const answerIsValid =
		problem.success.allowResultChange || response.equivalent;
	if (!answerIsValid) {
		return {
			passed: false,
			kind: "different-result",
			reason:
				response.difference ??
				"The rewrite returns a different answer, so its speed cannot count yet.",
			speedup: null,
		};
	}

	const speedup =
		response.candidate.medianMs > 0
			? response.baseline.medianMs / response.candidate.medianMs
			: Number.POSITIVE_INFINITY;
	const deterministicWorkImproved = hasDeterministicWorkImprovement(
		response.baseline.work,
		response.candidate.work,
	);

	if (deterministicWorkImproved) {
		return {
			passed: true,
			kind: null,
			reason: problem.success.allowResultChange
				? "The result was intentionally narrowed and deterministic work counters improved."
				: "The answer is equivalent and deterministic work counters improved; wall-clock timing is supporting evidence only.",
			speedup,
		};
	}

	if (speedup < problem.success.minimumSpeedup) {
		return {
			passed: false,
			kind: "no-plan-improvement",
			reason:
				"The answer holds, but the measured change is too small to call an optimization yet.",
			speedup,
		};
	}

	return {
		passed: true,
		kind: null,
		reason: problem.success.allowResultChange
			? "The result was intentionally narrowed and the measured work dropped."
			: "The answer is equivalent and the measured runtime improved.",
		speedup,
	};
}

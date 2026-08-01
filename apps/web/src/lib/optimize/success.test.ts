import { describe, expect, test } from "bun:test";

import { findOptimizationProblem } from "../curriculum/optimization-bank";
import { buildQueryPlan } from "../sql-engine/explain";
import type { CompareResponse, OptimizeResponse } from "../sql-engine/types";
import { evaluateIndexAttempt, evaluateRewriteAttempt } from "./success";

function response(fullScanSteps: number, details: string[]): OptimizeResponse {
	return {
		id: 1,
		op: "optimize",
		plan: buildQueryPlan(
			details.map((detail, index) => ({ id: index + 1, parent: 0, detail })),
		),
		benchmark: {
			medianMs: 1,
			minMs: 1,
			maxMs: 1,
			samples: 1,
			rowCount: 6,
			work: {
				fullScanSteps,
				vmSteps: 1,
				vmStepsOverflowed: false,
				sorts: 1,
				autoIndexRows: 0,
			},
		},
		appliedIndexes: [],
		matchedRows: 60_000,
		stages: null,
		data: null,
	};
}

describe("optimization success criteria", () => {
	test("does not pass the join lesson merely because the baseline already searches the listener primary key", () => {
		const problem = findOptimizationProblem("join-without-index");
		if (problem?.mode !== "index") {
			throw new Error("join-without-index fixture is missing");
		}

		const baseline = evaluateIndexAttempt(
			problem,
			response(59_999, [
				"SCAN p",
				"SEARCH l USING INTEGER PRIMARY KEY (rowid=?)",
				"USE TEMP B-TREE FOR GROUP BY",
			]),
		);
		const improved = evaluateIndexAttempt(
			problem,
			response(4_999, [
				"SCAN l",
				"SEARCH p USING COVERING INDEX idx_plays_listener (listener_id=?)",
				"USE TEMP B-TREE FOR GROUP BY",
			]),
		);

		expect(baseline.passed).toBe(false);
		expect(improved.passed).toBe(true);
	});

	test("accepts an equivalent rewrite that deterministically removes a full scan even when the noisy clock is flat", () => {
		const problem = findOptimizationProblem("sargable-arithmetic");
		if (problem?.mode !== "rewrite") {
			throw new Error("sargable-arithmetic fixture is missing");
		}
		const baseline = response(79_999, ["SCAN purchases"]);
		const candidate = response(0, [
			"SEARCH purchases USING COVERING INDEX idx_purchases_quantity (quantity=?)",
		]);
		const comparison: CompareResponse = {
			id: 2,
			op: "compare",
			baseline: baseline.benchmark,
			candidate: candidate.benchmark,
			baselinePlan: baseline.plan,
			candidatePlan: candidate.plan,
			equivalent: true,
			difference: null,
			baselineSample: {
				columns: ["id"],
				rows: [{ id: 1 }],
				rowCount: 1,
				truncated: false,
			},
			candidateSample: {
				columns: ["id"],
				rows: [{ id: 1 }],
				rowCount: 1,
				truncated: false,
			},
		};

		const result = evaluateRewriteAttempt(problem, comparison);

		expect(result.passed).toBe(true);
		expect(result.reason).toContain("deterministic work");
	});
});

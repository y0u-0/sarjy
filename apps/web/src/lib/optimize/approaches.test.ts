import { describe, expect, test } from "bun:test";

import { optimizationProblemBank } from "../curriculum/optimization-bank";
import { approachesForProblem } from "./approaches";

describe("optimization approach comparisons", () => {
	test("gives every problem multiple relevant approaches to compare", () => {
		for (const problem of optimizationProblemBank) {
			const approaches = approachesForProblem(problem);
			expect(approaches.length, problem.id).toBeGreaterThanOrEqual(3);
			expect(
				approaches.some((approach) => approach.fit === "best"),
				problem.id,
			).toBe(true);
		}
	});

	test("explains why materialization is a poor fit for a live point lookup", () => {
		const problem = optimizationProblemBank.find(
			(entry) => entry.id === "scan-to-seek",
		);
		if (!problem) throw new Error("scan-to-seek fixture is missing");

		const ctas = approachesForProblem(problem).find(
			(approach) => approach.technique === "CTAS",
		);
		expect(ctas?.fit).toBe("poor");
		expect(ctas?.tradeoff).toContain("stale");
	});

	test("compares both composite-index orders for the column-order lesson", () => {
		const problem = optimizationProblemBank.find(
			(entry) => entry.id === "composite-order",
		);
		if (!problem) throw new Error("composite-order fixture is missing");

		const approaches = approachesForProblem(problem);
		expect(
			approaches.some((approach) =>
				approach.title.includes("country, played_at"),
			),
		).toBe(true);
		expect(
			approaches.some((approach) =>
				approach.title.includes("played_at, country"),
			),
		).toBe(true);
	});
});

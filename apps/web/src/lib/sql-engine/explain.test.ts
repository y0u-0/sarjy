import { describe, expect, test } from "bun:test";

import { buildQueryPlan, diffPlans } from "./explain";

describe("SQLite query-plan labels", () => {
	test("does not call a full covering-index scan a seek", () => {
		const plan = buildQueryPlan([
			{
				id: 2,
				parent: 0,
				detail: "SCAN plays USING COVERING INDEX idx_plays_country",
			},
		]);

		expect(plan.flat[0]?.label).toBe("Full covering-index scan");
		expect(plan.flat[0]?.severity).toBe("warn");
	});

	test("distinguishes a covering search from a covering scan", () => {
		const plan = buildQueryPlan([
			{
				id: 3,
				parent: 0,
				detail:
					"SEARCH plays USING COVERING INDEX idx_plays_country (country=?)",
			},
		]);

		expect(plan.flat[0]?.label).toBe("Covering index search");
		expect(plan.flat[0]?.severity).toBe("good");
	});

	test("calls SQLite's temporary structure a B-tree without claiming it is in memory", () => {
		const plan = buildQueryPlan([
			{
				id: 4,
				parent: 0,
				detail: "USE TEMP B-TREE FOR ORDER BY",
			},
		]);

		expect(plan.flat[0]?.label).toBe("Temporary B-tree for ORDER BY");
	});

	test("does not call a removed temporary B-tree an in-memory sort", () => {
		const before = buildQueryPlan([
			{
				id: 4,
				parent: 0,
				detail: "USE TEMP B-TREE FOR ORDER BY",
			},
		]);

		expect(diffPlans(before, buildQueryPlan([])).headline).toBe(
			"The temporary B-tree is gone",
		);
	});
});

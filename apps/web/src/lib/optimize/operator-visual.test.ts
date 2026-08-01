import { expect, test } from "bun:test";

import { chooseRowColumns, classifyPlanOperator } from "./operator-visual";

function node(label: string, detail: string) {
	return {
		id: 1,
		parentId: 0,
		label,
		detail,
		severity: "bad" as const,
		table: "plays",
		index: null,
	};
}

test("classifies physical plan operators from SQLite's own wording", () => {
	expect(
		classifyPlanOperator(
			node("Temporary sort", "USE TEMP B-TREE FOR ORDER BY"),
			false,
		),
	).toBe("sort");
	expect(
		classifyPlanOperator(node("Full table scan", "SCAN plays"), false),
	).toBe("scan");
	expect(
		classifyPlanOperator(
			{
				...node("Index search", "SEARCH plays USING COVERING INDEX idx"),
				severity: "good",
			},
			false,
		),
	).toBe("seek");
});

test("chooses columns that expose the predicate and actual output", () => {
	expect(
		chooseRowColumns(
			["id", "listener_id", "country", "played_at"],
			[],
			"country = 'SA'",
			["COUNT(*)"],
		),
	).toEqual(["id", "country", "played_at"]);
});

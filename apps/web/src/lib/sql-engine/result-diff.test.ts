import { describe, expect, test } from "bun:test";

import { buildResultDiff, countDiffRows } from "./result-diff";
import type { QueryResult } from "./types";

function result(rows: Array<Record<string, string>>): QueryResult {
	return {
		columns: ["name"],
		rows,
		rowCount: rows.length,
		truncated: false,
		durationMs: 0,
	};
}

describe("result diff model", () => {
	test("treats duplicate rows as separate evidence", () => {
		const rows = buildResultDiff(
			result([{ name: "A" }]),
			result([{ name: "A" }, { name: "A" }]),
			false,
		);

		expect(countDiffRows(rows)).toEqual({
			match: 1,
			missing: 1,
			extra: 0,
			misordered: 0,
		});
	});

	test("separates ordering mistakes from row mistakes", () => {
		const rows = buildResultDiff(
			result([{ name: "B" }, { name: "A" }]),
			result([{ name: "A" }, { name: "B" }]),
			true,
		);

		expect(rows.map((row) => row.status)).toEqual(["misordered", "misordered"]);
	});
});

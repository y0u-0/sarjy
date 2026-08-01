import { expect, test } from "bun:test";

import { fromSources, measureStages, splitSelect } from "./query-stages";

test("parses CTE, join, filter, grouping, and quoted comment markers", () => {
	const parsed = splitSelect(`
		WITH recent AS (SELECT * FROM tracks WHERE title = '-- keep')
		SELECT DISTINCT a.id, COUNT(*) AS total /* remove */
		FROM albums AS a JOIN recent r ON r.album_id = a.id
		WHERE a.title <> '/* keep */'
		GROUP BY a.id
		HAVING COUNT(*) > 1
		ORDER BY total DESC;
	`);

	expect(parsed.blockers).toEqual([]);
	expect(parsed.cteNames.has("recent")).toBe(true);
	expect(parsed.distinct).toBe(true);
	expect(parsed.aggregated).toBe(true);
	expect(parsed.where).toBe("a.title <> '/* keep */'");
	expect(parsed.groupBy).toBe("a.id");
	expect(parsed.having).toBe("COUNT(*) > 1");
	expect(fromSources(parsed.from ?? "")).toEqual([
		{ source: "albums", alias: "a" },
		{ source: "recent", alias: "r" },
	]);
});

test("measures the authored logical stages and annotates physical input access", () => {
	const counts = [10, 100, 200, 20];
	const report = measureStages(
		"SELECT a.id FROM albums a JOIN tracks t ON t.album_id = a.id WHERE t.milliseconds > 300000",
		{
			count: () => counts.shift() ?? 0,
			planLines: ["SCAN a", "SEARCH t USING INDEX idx_tracks_album"],
			finalRowCount: 5,
		},
	);

	expect(report.supported).toBe(true);
	expect(report.stages.map((stage) => [stage.stage, stage.rows])).toEqual([
		["input", 10],
		["input", 100],
		["join", 200],
		["where", 20],
		["final", 5],
	]);
	expect(report.stages[0]).toMatchObject({ fullyScanned: true });
	expect(report.stages[1]).toMatchObject({ indexLookup: true });
	expect(report.notes.some((note) => note.startsWith("Fan-out:"))).toBe(true);
});

test("declines unsupported window queries instead of inventing stage counts", () => {
	const report = measureStages(
		"SELECT id, ROW_NUMBER() OVER (ORDER BY id) FROM tracks",
		{
			count: () => {
				throw new Error("must not probe");
			},
			planLines: [],
			finalRowCount: 4,
		},
	);

	expect(report.supported).toBe(false);
	expect(report.blockers).toContain("window-function");
});

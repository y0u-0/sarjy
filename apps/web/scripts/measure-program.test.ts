import { describe, expect, test } from "bun:test";

import { measure, measureProgram, withDb } from "./measure";

const DDL = `
CREATE TABLE items (id INTEGER PRIMARY KEY, category TEXT NOT NULL);
INSERT INTO items VALUES (1, 'a'), (2, 'a'), (3, 'b');
`;

describe("offline optimization measurement", () => {
	test("includes CTAS setup work and compares the final statement result", async () => {
		const baseline = await withDb(DDL, [], (sqlite3, db) =>
			measure(
				sqlite3,
				db,
				"SELECT category, COUNT(*) FROM items GROUP BY category",
				1,
			),
		);
		const candidate = await withDb(DDL, [], (sqlite3, db) =>
			measureProgram(
				sqlite3,
				db,
				`CREATE TEMP TABLE counts AS
SELECT category, COUNT(*) AS n FROM items GROUP BY category;
SELECT category, n FROM counts;`,
				1,
			),
		);

		expect(candidate.digest).toBe(baseline.digest);
		expect(candidate.rows).toBe(2);
		expect(candidate.vmSteps).toBeGreaterThan(0);
		expect(candidate.plan).toEqual(["SCAN counts"]);
	});
});

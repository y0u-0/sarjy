import { expect, test } from "bun:test";

import { splitSqlProgram } from "./sql-program";

test("splits CTAS setup from its final query", () => {
	expect(
		splitSqlProgram(`CREATE TEMP TABLE summary AS
SELECT 'album;one' AS label;
-- the final semicolon is optional
SELECT * FROM summary`),
	).toEqual([
		"CREATE TEMP TABLE summary AS\nSELECT 'album;one' AS label",
		"-- the final semicolon is optional\nSELECT * FROM summary",
	]);
});

test("ignores semicolons in SQL quotes and comments", () => {
	const statements = splitSqlProgram(`
/* ; */ SELECT "a;b", 'it''s;fine', [c;d], \`e;f\`;
SELECT 2; -- ;
`);
	expect(statements).toHaveLength(2);
	expect(statements[0]).toContain("'it''s;fine'");
	expect(statements[1]).toContain("SELECT 2");
});

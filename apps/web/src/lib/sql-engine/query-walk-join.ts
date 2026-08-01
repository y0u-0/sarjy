import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { CellValue } from "./result-types";
import { toCellValue, withTimeGuard } from "./sqlite-runtime";
import type { JoinKind, JoinWalk, WalkRow } from "./walk-types";

export const MAX_WALK_ROWS = 60;

export function readWalkRows(
	sqlite3: Sqlite3Static,
	db: Database,
	table: string,
): { rows: WalkRow[]; columns: string[]; seen: number } {
	const columns: string[] = [];
	const rows: WalkRow[] = [];
	let seen = 0;
	withTimeGuard(sqlite3, db, () => {
		db.exec({
			sql: `SELECT rowid AS __rid, * FROM ${table}`,
			rowMode: "object",
			callback: (row) => {
				seen++;
				if (rows.length >= MAX_WALK_ROWS) return;
				const record = row as Record<string, unknown>;
				const cells: Record<string, CellValue> = {};
				for (const [key, value] of Object.entries(record)) {
					if (key === "__rid") continue;
					if (!columns.includes(key)) columns.push(key);
					cells[key] = toCellValue(value);
				}
				rows.push({ rowid: Number(record.__rid), cells });
			},
		});
	});
	return { rows, columns, seen };
}

function joinKindOf(from: string): JoinKind {
	const text = from.toUpperCase();
	if (/\bCROSS\s+JOIN\b/.test(text)) return "cross";
	if (/\b(LEFT|RIGHT|FULL)\b/.test(text)) return "left";
	if (/\bJOIN\b/.test(text)) return "inner";
	return "comma";
}

export function walkJoin(
	sqlite3: Sqlite3Static,
	db: Database,
	parsed: { from: string; where: string | null },
	sources: { source: string; alias: string }[],
): JoinWalk | null {
	const [left, right] = sources;
	const leftSide = readWalkRows(sqlite3, db, left.source);
	const rightSide = readWalkRows(sqlite3, db, right.source);
	const pairs: { left: number; right: number | null }[] = [];
	try {
		withTimeGuard(sqlite3, db, () => {
			db.exec({
				sql: `SELECT ${left.alias}.rowid AS __l, ${right.alias}.rowid AS __r FROM ${parsed.from}${
					parsed.where ? ` WHERE ${parsed.where}` : ""
				} LIMIT ${MAX_WALK_ROWS * MAX_WALK_ROWS}`,
				rowMode: "object",
				callback: (row) => {
					const record = row as { __l: unknown; __r: unknown };
					pairs.push({
						left: Number(record.__l),
						right: record.__r === null ? null : Number(record.__r),
					});
				},
			});
		});
	} catch {
		return null;
	}

	const onMatch = /\bON\s+(.+?)(?:\s+(?:WHERE|GROUP|ORDER|LIMIT)\b|$)/is.exec(
		parsed.from,
	);
	return {
		leftTable: left.source,
		leftAlias: left.alias,
		rightTable: right.source,
		rightAlias: right.alias,
		leftRows: leftSide.rows,
		rightRows: rightSide.rows,
		leftColumns: leftSide.columns,
		rightColumns: rightSide.columns,
		pairs,
		kind: joinKindOf(parsed.from),
		on: onMatch ? onMatch[1].trim() : null,
	};
}

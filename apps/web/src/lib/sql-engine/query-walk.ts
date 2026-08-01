import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import { readWalkRows, walkJoin } from "./query-walk-join";
import { fromSources, splitSelect } from "./select-parser";
import { withTimeGuard } from "./sqlite-runtime";
import type { WalkResponse } from "./walk-types";

type WalkResult = Omit<WalkResponse, "id" | "op">;

const EMPTY_WALK = {
	table: null,
	columns: [],
	rows: [],
	matchedRowids: [],
	where: null,
	projected: [],
	truncated: false,
	join: null,
};

export function walkQuery(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
): WalkResult {
	const parsed = splitSelect(sql);
	if (parsed.blockers.length || !parsed.from) {
		return { supported: false, blockers: parsed.blockers, ...EMPTY_WALK };
	}
	const sources = fromSources(parsed.from);
	if (!sources) {
		return {
			supported: false,
			blockers: ["from-not-a-plain-table"],
			...EMPTY_WALK,
		};
	}
	if (sources.length === 2) {
		const join = walkJoin(
			sqlite3,
			db,
			{ from: parsed.from, where: parsed.where },
			sources,
		);
		return join
			? {
					supported: true,
					blockers: [],
					...EMPTY_WALK,
					where: parsed.where,
					join,
				}
			: { supported: false, blockers: ["join-not-walkable"], ...EMPTY_WALK };
	}
	if (sources.length > 2) {
		return { supported: false, blockers: ["too-many-tables"], ...EMPTY_WALK };
	}

	const source = sources[0];
	const table = source.source;
	const fromTable =
		source.alias && source.alias !== source.source
			? `${source.source} AS ${source.alias}`
			: source.source;
	const { columns, rows, seen } = readWalkRows(sqlite3, db, table);
	const matchedRowids: number[] = [];
	withTimeGuard(sqlite3, db, () => {
		db.exec({
			sql: parsed.where
				? `SELECT rowid AS __rid FROM ${fromTable} WHERE ${parsed.where}`
				: `SELECT rowid AS __rid FROM ${fromTable}`,
			rowMode: "object",
			callback: (row) => {
				matchedRowids.push(Number((row as { __rid: unknown }).__rid));
			},
		});
	});

	const selectList = parsed.selectList.trim();
	const projected =
		selectList === "*"
			? [...columns]
			: selectList
					.split(",")
					.map((part) => {
						const cleaned = part.trim().replace(/^[a-z_][\w]*\./i, "");
						const match = /^([a-z_][\w]*)$/i.exec(cleaned);
						return match ? match[1] : null;
					})
					.filter((name): name is string => name !== null)
					.filter((name) => columns.includes(name));
	return {
		supported: true,
		blockers: [],
		table,
		columns,
		rows,
		matchedRowids,
		where: parsed.where,
		projected,
		truncated: seen > rows.length,
		join: null,
	};
}

import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { TableInfo } from "./result-types";
import { runOnFreshDb } from "./sqlite-runtime";

export function describeTables(
	sqlite3: Sqlite3Static,
	ddl: string,
): TableInfo[] {
	return runOnFreshDb(sqlite3, ddl, (db) => {
		const tableNames: string[] = [];
		db.exec({
			sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
			rowMode: "object",
			callback: (row) => {
				tableNames.push(String((row as { name: unknown }).name));
			},
		});

		return tableNames.map((name) => {
			const columns: TableInfo["columns"] = [];
			db.exec({
				sql: `PRAGMA table_info(${JSON.stringify(name)})`,
				rowMode: "object",
				callback: (row) => {
					const info = row as { name: unknown; type: unknown };
					columns.push({ name: String(info.name), type: String(info.type) });
				},
			});
			let rowCount = 0;
			db.exec({
				sql: `SELECT COUNT(*) AS count FROM ${JSON.stringify(name)}`,
				rowMode: "object",
				callback: (row) => {
					rowCount = Number((row as { count: unknown }).count);
				},
			});
			return { name, columns, rowCount };
		});
	});
}

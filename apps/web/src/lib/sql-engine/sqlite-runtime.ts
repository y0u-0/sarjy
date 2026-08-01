import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { CellValue, QueryResult } from "./result-types";

export const SOFT_TIMEOUT_MS = 3_000;
export const SLOW_TEACHING_TIMEOUT_MS = 25_000;
export const BENCHMARK_BUDGET_MS = 6_000;
const PROGRESS_HANDLER_OP_INTERVAL = 5_000;
const MAX_ROWS = 500;

export function toCellValue(value: unknown): CellValue {
	if (value === null || value === undefined) return null;
	if (typeof value === "number" || typeof value === "string") return value;
	if (typeof value === "bigint") {
		return value >= BigInt(Number.MIN_SAFE_INTEGER) &&
			value <= BigInt(Number.MAX_SAFE_INTEGER)
			? Number(value)
			: value.toString();
	}
	if (value instanceof Uint8Array || value instanceof ArrayBuffer)
		return "<BLOB>";
	return String(value);
}

export function cleanSqliteError(message: string): string {
	return message
		.replace(/^(?:SQLITE_[A-Z_]+:\s*)?(?:sqlite3 result code \d+:\s*)?/i, "")
		.trim();
}

export function isInterruptError(error: unknown): boolean {
	return error instanceof Error && /interrupt/i.test(error.message);
}

export function withTimeGuard<T>(
	sqlite3: Sqlite3Static,
	db: Database,
	run: () => T,
	timeoutMs = SOFT_TIMEOUT_MS,
): T {
	const deadline = Date.now() + timeoutMs;
	const dbPointer = db.pointer;
	if (dbPointer === undefined) throw new Error("Database handle is closed");
	sqlite3.capi.sqlite3_progress_handler(
		dbPointer,
		PROGRESS_HANDLER_OP_INTERVAL,
		() => (Date.now() > deadline ? 1 : 0),
		0,
	);
	try {
		return run();
	} finally {
		sqlite3.capi.sqlite3_progress_handler(dbPointer, 0, 0, 0);
	}
}

export function executeQuery(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
): QueryResult {
	const columns: string[] = [];
	const rows: Record<string, CellValue>[] = [];
	let rowCount = 0;
	const startedAt = performance.now();
	withTimeGuard(sqlite3, db, () => {
		db.exec({
			sql,
			rowMode: "object",
			columnNames: columns,
			callback: (row) => {
				rowCount++;
				if (rowCount > MAX_ROWS) return;
				const converted: Record<string, CellValue> = {};
				for (const [key, value] of Object.entries(
					row as Record<string, unknown>,
				)) {
					converted[key] = toCellValue(value);
				}
				rows.push(converted);
			},
		});
	});
	return {
		columns,
		rows,
		rowCount,
		truncated: rowCount > MAX_ROWS,
		durationMs: Math.round(performance.now() - startedAt),
	};
}

export function runOnFreshDb<T>(
	sqlite3: Sqlite3Static,
	ddl: string,
	run: (db: Database) => T,
): T {
	const db = new sqlite3.oo1.DB(":memory:");
	try {
		db.exec(ddl);
		return run(db);
	} finally {
		db.close();
	}
}

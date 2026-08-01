import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { EngineResponse } from "./engine-protocol";
import type { QueryPlan } from "./plan-types";
import type { CellValue, QuerySample } from "./result-types";
import { explainQueryPlan } from "./sqlite-plan";
import {
	benchmarkProgram,
	runProgramSetup,
	sqlProgram,
} from "./sqlite-program";
import {
	runOnFreshDb,
	SLOW_TEACHING_TIMEOUT_MS,
	toCellValue,
	withTimeGuard,
} from "./sqlite-runtime";

const MAX_QUERY_SAMPLE_ROWS = 12;

interface QueryFingerprint {
	count: number;
	digest: string;
	sample: QuerySample;
}

function fingerprint(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
): QueryFingerprint {
	const rows: string[] = [];
	const columns: string[] = [];
	const sampleRows: Record<string, CellValue>[] = [];
	withTimeGuard(
		sqlite3,
		db,
		() => {
			db.exec({
				sql,
				rowMode: "object",
				columnNames: columns,
				callback: (row) => {
					const record = row as Record<string, unknown>;
					if (sampleRows.length < MAX_QUERY_SAMPLE_ROWS) {
						const sample: Record<string, CellValue> = {};
						for (const [key, value] of Object.entries(record)) {
							sample[key] = toCellValue(value);
						}
						sampleRows.push(sample);
					}
					rows.push(
						Object.values(record)
							.map((value) => String(toCellValue(value)))
							.join("\u0001"),
					);
				},
			});
		},
		SLOW_TEACHING_TIMEOUT_MS,
	);
	rows.sort();
	return {
		count: rows.length,
		digest: rows.join("\u0002"),
		sample: {
			columns,
			rows: sampleRows,
			rowCount: rows.length,
			truncated: rows.length > sampleRows.length,
		},
	};
}

function fingerprintProgram(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
): QueryFingerprint {
	const statements = sqlProgram(sql);
	runProgramSetup(sqlite3, db, statements.slice(0, -1));
	return fingerprint(sqlite3, db, statements.at(-1) as string);
}

function explainProgram(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
): QueryPlan {
	const statements = sqlProgram(sql);
	runProgramSetup(sqlite3, db, statements.slice(0, -1));
	return explainQueryPlan(sqlite3, db, statements.at(-1) as string);
}

export function comparePrograms(
	sqlite3: Sqlite3Static,
	ddl: string,
	indexes: string[],
	baselineSql: string,
	candidateSql: string,
	samples: number,
): Omit<Extract<EngineResponse, { op: "compare" }>, "id" | "op"> {
	const onFreshDatabase = <T>(run: (db: Database) => T): T =>
		runOnFreshDb(sqlite3, ddl, (db) => {
			for (const statement of indexes) db.exec(statement);
			if (indexes.length > 0) db.exec("ANALYZE");
			return run(db);
		});
	const before = onFreshDatabase((db) =>
		fingerprintProgram(sqlite3, db, baselineSql),
	);
	const after = onFreshDatabase((db) =>
		fingerprintProgram(sqlite3, db, candidateSql),
	);
	const equivalent = before.digest === after.digest;
	const difference = equivalent
		? null
		: before.count !== after.count
			? `The original returns ${before.count.toLocaleString()} row(s); yours returns ${after.count.toLocaleString()}.`
			: "Both return the same number of rows, but some values differ.";

	return {
		baseline: onFreshDatabase((db) =>
			benchmarkProgram(sqlite3, db, baselineSql, samples),
		),
		candidate: onFreshDatabase((db) =>
			benchmarkProgram(sqlite3, db, candidateSql, samples),
		),
		baselinePlan: onFreshDatabase((db) =>
			explainProgram(sqlite3, db, baselineSql),
		),
		candidatePlan: onFreshDatabase((db) =>
			explainProgram(sqlite3, db, candidateSql),
		),
		equivalent,
		difference,
		baselineSample: before.sample,
		candidateSample: after.sample,
	};
}

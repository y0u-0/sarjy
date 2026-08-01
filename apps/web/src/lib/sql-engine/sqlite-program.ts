import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { BenchmarkResult, WorkCounters } from "./plan-types";
import { splitSqlProgram } from "./sql-program";
import {
	benchmarkQuery,
	MAX_BENCHMARK_SAMPLES,
	summarizeBenchmark,
} from "./sqlite-benchmark";
import { emptyWork, mergeWork, readStatementWork } from "./sqlite-plan";
import {
	BENCHMARK_BUDGET_MS,
	SLOW_TEACHING_TIMEOUT_MS,
	withTimeGuard,
} from "./sqlite-runtime";

export function sqlProgram(sql: string): string[] {
	const statements = splitSqlProgram(sql);
	if (statements.length === 0) throw new Error("The SQL program is empty.");
	return statements;
}

function executeProgramOnce(
	sqlite3: Sqlite3Static,
	db: Database,
	statements: string[],
): { durationMs: number; rowCount: number; work: WorkCounters } {
	let rowCount = 0;
	let work = emptyWork();
	const startedAt = performance.now();
	withTimeGuard(
		sqlite3,
		db,
		() => {
			for (const [index, sql] of statements.entries()) {
				const stmt = db.prepare(sql);
				try {
					let rows = 0;
					while (stmt.step()) rows++;
					if (index === statements.length - 1) rowCount = rows;
					work = mergeWork(work, readStatementWork(sqlite3, stmt));
				} finally {
					stmt.finalize();
				}
			}
		},
		SLOW_TEACHING_TIMEOUT_MS,
	);
	return { durationMs: performance.now() - startedAt, rowCount, work };
}

export function benchmarkProgram(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
	samples: number,
): BenchmarkResult {
	const statements = sqlProgram(sql);
	if (statements.length === 1) {
		return benchmarkQuery(
			sqlite3,
			db,
			statements[0] as string,
			samples,
			SLOW_TEACHING_TIMEOUT_MS,
		);
	}

	const count = Math.min(Math.max(1, samples), MAX_BENCHMARK_SAMPLES);
	const timings: number[] = [];
	let rowCount = 0;
	let work: WorkCounters | null = null;
	const budgetStartedAt = performance.now();
	for (let index = 0; index < count; index++) {
		db.exec("SAVEPOINT optimization_program_sample");
		try {
			const result = executeProgramOnce(sqlite3, db, statements);
			timings.push(result.durationMs);
			rowCount = result.rowCount;
			if (index === 0) work = result.work;
		} finally {
			db.exec(
				"ROLLBACK TO optimization_program_sample; RELEASE optimization_program_sample",
			);
		}
		if (performance.now() - budgetStartedAt > BENCHMARK_BUDGET_MS) break;
	}
	return summarizeBenchmark(timings, rowCount, work);
}

export function runProgramSetup(
	sqlite3: Sqlite3Static,
	db: Database,
	statements: string[],
): void {
	withTimeGuard(
		sqlite3,
		db,
		() => {
			for (const sql of statements) {
				const stmt = db.prepare(sql);
				try {
					while (stmt.step()) {
						// Setup rows are intentionally discarded.
					}
				} finally {
					stmt.finalize();
				}
			}
		},
		SLOW_TEACHING_TIMEOUT_MS,
	);
}

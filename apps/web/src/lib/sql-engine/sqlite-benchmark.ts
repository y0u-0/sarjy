import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { BenchmarkResult, WorkCounters } from "./plan-types";
import { readStatementWork } from "./sqlite-plan";
import {
	BENCHMARK_BUDGET_MS,
	SOFT_TIMEOUT_MS,
	withTimeGuard,
} from "./sqlite-runtime";

export const MAX_BENCHMARK_SAMPLES = 25;

export function summarizeBenchmark(
	timings: number[],
	rowCount: number,
	work: WorkCounters | null,
): BenchmarkResult {
	const sorted = [...timings].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 0
			? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
			: (sorted[middle] ?? 0);
	return {
		medianMs: Number(median.toFixed(3)),
		minMs: Number((sorted[0] ?? 0).toFixed(3)),
		maxMs: Number((sorted[sorted.length - 1] ?? 0).toFixed(3)),
		samples: timings.length,
		rowCount,
		work,
	};
}

export function benchmarkQuery(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
	samples: number,
	timeoutMs = SOFT_TIMEOUT_MS,
): BenchmarkResult {
	const count = Math.min(Math.max(1, samples), MAX_BENCHMARK_SAMPLES);
	const timings: number[] = [];
	let rowCount = 0;
	let work: WorkCounters | null = null;
	const budgetStartedAt = performance.now();
	const stmt = db.prepare(sql);
	try {
		for (let index = 0; index < count; index++) {
			const startedAt = performance.now();
			let rows = 0;
			withTimeGuard(
				sqlite3,
				db,
				() => {
					while (stmt.step()) rows++;
				},
				timeoutMs,
			);
			timings.push(performance.now() - startedAt);
			rowCount = rows;
			if (index === 0) work = readStatementWork(sqlite3, stmt);
			stmt.reset();
			if (performance.now() - budgetStartedAt > BENCHMARK_BUDGET_MS) break;
		}
	} finally {
		stmt.finalize();
	}
	return summarizeBenchmark(timings, rowCount, work);
}

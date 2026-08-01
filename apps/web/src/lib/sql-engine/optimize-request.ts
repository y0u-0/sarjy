import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { OptimizeRequest, OptimizeResponse } from "./engine-protocol";
import { measureStages } from "./query-stage-measurement";
import { walkQuery } from "./query-walk";
import { benchmarkQuery } from "./sqlite-benchmark";
import { explainQueryPlan } from "./sqlite-plan";
import {
	executeQuery,
	runOnFreshDb,
	SLOW_TEACHING_TIMEOUT_MS,
	withTimeGuard,
} from "./sqlite-runtime";

function countFirstValue(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
): number {
	let value = 0;
	withTimeGuard(sqlite3, db, () => {
		db.exec({
			sql,
			rowMode: "object",
			callback: (row) => {
				value = Number(Object.values(row as Record<string, unknown>)[0] ?? 0);
			},
		});
	});
	return value;
}

export function handleOptimizeRequest(
	sqlite3: Sqlite3Static,
	request: OptimizeRequest,
): OptimizeResponse {
	return runOnFreshDb(sqlite3, request.ddl, (db) => {
		for (const statement of request.indexes) db.exec(statement);
		db.exec("ANALYZE");
		const matchedRows = request.matchedSql
			? countFirstValue(sqlite3, db, request.matchedSql)
			: 0;
		const plan = explainQueryPlan(sqlite3, db, request.sql);
		const benchmark = benchmarkQuery(
			sqlite3,
			db,
			request.sql,
			request.samples,
			SLOW_TEACHING_TIMEOUT_MS,
		);
		const stages = request.withStages
			? measureStages(request.sql, {
					count: (sql) => countFirstValue(sqlite3, db, sql),
					planLines: plan.flat.map((node) => node.detail),
					finalRowCount: benchmark.rowCount,
				})
			: null;
		const data = request.withData
			? {
					walk: {
						id: request.id,
						op: "walk" as const,
						...walkQuery(sqlite3, db, request.sql),
					},
					sample: executeQuery(sqlite3, db, request.sql),
				}
			: null;
		return {
			id: request.id,
			op: "optimize",
			plan,
			benchmark,
			appliedIndexes: request.indexes,
			matchedRows,
			stages,
			data,
		};
	});
}

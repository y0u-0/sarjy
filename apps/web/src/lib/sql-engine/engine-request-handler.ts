import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import type { EngineRequest, EngineResponse } from "./engine-protocol";
import { gradeResult } from "./grade";
import { handleOptimizeRequest } from "./optimize-request";
import { comparePrograms } from "./query-equivalence";
import { walkQuery } from "./query-walk";
import { executeQuery, runOnFreshDb } from "./sqlite-runtime";
import { describeTables } from "./sqlite-schema";

export function handleEngineRequest(
	sqlite3: Sqlite3Static,
	request: EngineRequest,
): EngineResponse {
	switch (request.op) {
		case "run": {
			const result = runOnFreshDb(sqlite3, request.ddl, (db) =>
				executeQuery(sqlite3, db, request.sql),
			);
			return { id: request.id, op: "run", result };
		}
		case "submit": {
			const result = runOnFreshDb(sqlite3, request.ddl, (db) =>
				executeQuery(sqlite3, db, request.sql),
			);
			const expected = runOnFreshDb(sqlite3, request.ddl, (db) =>
				executeQuery(sqlite3, db, request.referenceSql),
			);
			return {
				id: request.id,
				op: "submit",
				result,
				expected,
				grade: gradeResult(result, expected, request.ordered),
			};
		}
		case "compare":
			return {
				id: request.id,
				op: "compare",
				...comparePrograms(
					sqlite3,
					request.ddl,
					request.indexes,
					request.baselineSql,
					request.candidateSql,
					request.samples,
				),
			};
		case "walk":
			return runOnFreshDb(sqlite3, request.ddl, (db) => ({
				id: request.id,
				op: "walk",
				...walkQuery(sqlite3, db, request.sql),
			}));
		case "describe":
			return {
				id: request.id,
				op: "describe",
				tables: describeTables(sqlite3, request.ddl),
			};
		case "optimize":
			return handleOptimizeRequest(sqlite3, request);
	}
}

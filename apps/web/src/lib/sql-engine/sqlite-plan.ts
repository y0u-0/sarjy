import type {
	Database,
	PreparedStatement,
	Sqlite3Static,
} from "@sqlite.org/sqlite-wasm";

import { buildQueryPlan, type RawPlanRow } from "./explain";
import type { QueryPlan, WorkCounters } from "./plan-types";
import { withTimeGuard } from "./sqlite-runtime";

export function explainQueryPlan(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
): QueryPlan {
	const rows: RawPlanRow[] = [];
	withTimeGuard(sqlite3, db, () => {
		db.exec({
			sql: `EXPLAIN QUERY PLAN ${sql}`,
			rowMode: "object",
			callback: (row) => {
				const record = row as {
					id: unknown;
					parent: unknown;
					detail: unknown;
				};
				rows.push({
					id: Number(record.id),
					parent: Number(record.parent),
					detail: String(record.detail),
				});
			},
		});
	});
	return buildQueryPlan(rows);
}

export function readStatementWork(
	sqlite3: Sqlite3Static,
	stmt: PreparedStatement,
): WorkCounters {
	const pointer = stmt.pointer;
	const { capi } = sqlite3;
	if (pointer === undefined) return emptyWork();
	const rawSteps = capi.sqlite3_stmt_status(
		pointer,
		capi.SQLITE_STMTSTATUS_VM_STEP,
		0,
	);
	return {
		fullScanSteps: capi.sqlite3_stmt_status(
			pointer,
			capi.SQLITE_STMTSTATUS_FULLSCAN_STEP,
			0,
		),
		vmSteps: rawSteps < 0 ? 0 : rawSteps,
		vmStepsOverflowed: rawSteps < 0,
		sorts: capi.sqlite3_stmt_status(pointer, capi.SQLITE_STMTSTATUS_SORT, 0),
		autoIndexRows: capi.sqlite3_stmt_status(
			pointer,
			capi.SQLITE_STMTSTATUS_AUTOINDEX,
			0,
		),
	};
}

export function emptyWork(): WorkCounters {
	return {
		fullScanSteps: 0,
		vmSteps: 0,
		vmStepsOverflowed: false,
		sorts: 0,
		autoIndexRows: 0,
	};
}

export function mergeWork(
	total: WorkCounters,
	next: WorkCounters,
): WorkCounters {
	const overflowed = total.vmStepsOverflowed || next.vmStepsOverflowed;
	return {
		fullScanSteps: total.fullScanSteps + next.fullScanSteps,
		vmSteps: overflowed ? 0 : total.vmSteps + next.vmSteps,
		vmStepsOverflowed: overflowed,
		sorts: total.sorts + next.sorts,
		autoIndexRows: total.autoIndexRows + next.autoIndexRows,
	};
}

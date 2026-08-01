/**
 * Offline measurement harness, mirroring the worker's benchmarkQuery exactly.
 *
 * Exists so an optimization problem can be verified before it ships. Every stored
 * claim about a problem — that the slow form is slow, that the fast form is fast,
 * that both answer the same question — is produced by running this, never by
 * reasoning about what SQLite ought to do. That distinction has already caught two
 * lessons in this project that were plausible and wrong.
 */
import sqlite3InitModule, {
	type Database,
	type PreparedStatement,
	type Sqlite3Static,
} from "@sqlite.org/sqlite-wasm";

import { splitSqlProgram } from "../src/lib/sql-engine/sql-program";

export interface Work {
	fullScanSteps: number;
	vmSteps: number;
	/** The 32-bit counter wrapped; vmSteps is meaningless when this is set. */
	vmStepsOverflowed: boolean;
	sorts: number;
	autoIndexRows: number;
}

export interface Measurement extends Work {
	rows: number;
	medianMs: number;
	/** Order-insensitive digest of the result VALUES, for equivalence checking. */
	digest: string;
	plan: string[];
}

const DEFAULT_SAMPLES = 5;

function readWork(sqlite3: Sqlite3Static, stmt: PreparedStatement): Work {
	const p = stmt.pointer;
	const { capi } = sqlite3;
	if (p === undefined) throw new Error("statement has no pointer");
	const rawSteps = capi.sqlite3_stmt_status(
		p,
		capi.SQLITE_STMTSTATUS_VM_STEP,
		0,
	);
	return {
		fullScanSteps: capi.sqlite3_stmt_status(
			p,
			capi.SQLITE_STMTSTATUS_FULLSCAN_STEP,
			0,
		),
		vmSteps: rawSteps < 0 ? 0 : rawSteps,
		vmStepsOverflowed: rawSteps < 0,
		sorts: capi.sqlite3_stmt_status(p, capi.SQLITE_STMTSTATUS_SORT, 0),
		autoIndexRows: capi.sqlite3_stmt_status(
			p,
			capi.SQLITE_STMTSTATUS_AUTOINDEX,
			0,
		),
	};
}

export function measure(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
	samples = DEFAULT_SAMPLES,
): Measurement {
	const plan: string[] = [];
	db.exec({
		sql: `EXPLAIN QUERY PLAN ${sql}`,
		rowMode: "object",
		callback: (row) => {
			plan.push(String((row as { detail: unknown }).detail));
		},
	});

	// Values only, sorted — column names deliberately excluded, so COUNT(id) and
	// COUNT(*) compare equal when they answer the same question.
	const rowStrings: string[] = [];
	db.exec({
		sql,
		rowMode: "object",
		callback: (row) => {
			rowStrings.push(
				Object.values(row as Record<string, unknown>)
					.map((value) => String(value))
					.join(""),
			);
		},
	});
	const digest = [...rowStrings].sort().join("");

	const timings: number[] = [];
	let work: Work | null = null;
	let rows = 0;
	const stmt = db.prepare(sql);
	try {
		for (let i = 0; i < Math.max(1, samples); i++) {
			const startedAt = performance.now();
			let n = 0;
			while (stmt.step()) n += 1;
			timings.push(performance.now() - startedAt);
			rows = n;
			if (i === 0) work = readWork(sqlite3, stmt);
			stmt.reset();
		}
	} finally {
		stmt.finalize();
	}

	const sorted = [...timings].sort((a, b) => a - b);
	if (!work) throw new Error("no counters read");

	return {
		...work,
		rows,
		medianMs: Number((sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(3)),
		digest,
		plan,
	};
}

function emptyWork(): Work {
	return {
		fullScanSteps: 0,
		vmSteps: 0,
		vmStepsOverflowed: false,
		sorts: 0,
		autoIndexRows: 0,
	};
}

function mergeWork(total: Work, next: Work): Work {
	const overflowed = total.vmStepsOverflowed || next.vmStepsOverflowed;
	return {
		fullScanSteps: total.fullScanSteps + next.fullScanSteps,
		vmSteps: overflowed ? 0 : total.vmSteps + next.vmSteps,
		vmStepsOverflowed: overflowed,
		sorts: total.sorts + next.sorts,
		autoIndexRows: total.autoIndexRows + next.autoIndexRows,
	};
}

function inSavepoint<T>(db: Database, name: string, run: () => T): T {
	db.exec(`SAVEPOINT ${name}`);
	try {
		return run();
	} finally {
		db.exec(`ROLLBACK TO ${name}; RELEASE ${name}`);
	}
}

/** Measures a multi-statement optimization, including setup such as CTAS. */
export function measureProgram(
	sqlite3: Sqlite3Static,
	db: Database,
	sql: string,
	samples = DEFAULT_SAMPLES,
): Measurement {
	const statements = splitSqlProgram(sql);
	if (statements.length === 0) throw new Error("The SQL program is empty.");
	if (statements.length === 1) {
		return measure(sqlite3, db, statements[0] as string, samples);
	}

	const setup = statements.slice(0, -1);
	const final = statements.at(-1) as string;
	const runSetup = () => {
		for (const statement of setup) db.exec(statement);
	};

	const plan = inSavepoint(db, "measure_program_plan", () => {
		runSetup();
		const lines: string[] = [];
		db.exec({
			sql: `EXPLAIN QUERY PLAN ${final}`,
			rowMode: "object",
			callback: (row) => {
				lines.push(String((row as { detail: unknown }).detail));
			},
		});
		return lines;
	});

	const digest = inSavepoint(db, "measure_program_digest", () => {
		runSetup();
		const rows: string[] = [];
		db.exec({
			sql: final,
			rowMode: "object",
			callback: (row) => {
				rows.push(
					Object.values(row as Record<string, unknown>)
						.map((value) => String(value))
						.join("\u0001"),
				);
			},
		});
		return [...rows].sort().join("\u0002");
	});

	const timings: number[] = [];
	let rows = 0;
	let work = emptyWork();
	for (let sample = 0; sample < Math.max(1, samples); sample++) {
		const result = inSavepoint(db, `measure_program_sample_${sample}`, () => {
			const startedAt = performance.now();
			let sampleRows = 0;
			let sampleWork = emptyWork();
			for (const [index, statement] of statements.entries()) {
				const prepared = db.prepare(statement);
				try {
					let statementRows = 0;
					while (prepared.step()) statementRows += 1;
					if (index === statements.length - 1) sampleRows = statementRows;
					sampleWork = mergeWork(sampleWork, readWork(sqlite3, prepared));
				} finally {
					prepared.finalize();
				}
			}
			return {
				durationMs: performance.now() - startedAt,
				rows: sampleRows,
				work: sampleWork,
			};
		});
		timings.push(result.durationMs);
		rows = result.rows;
		if (sample === 0) work = result.work;
	}

	const sorted = [...timings].sort((a, b) => a - b);
	return {
		...work,
		rows,
		medianMs: Number((sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(3)),
		digest,
		plan,
	};
}

export async function withDb<T>(
	ddl: string,
	indexes: string[],
	run: (sqlite3: Sqlite3Static, db: Database) => T,
): Promise<T> {
	const sqlite3 = await sqlite3InitModule();
	const db = new sqlite3.oo1.DB(":memory:");
	try {
		db.exec(ddl);
		for (const index of indexes) db.exec(index);
		if (indexes.length > 0) db.exec("ANALYZE");
		return run(sqlite3, db);
	} finally {
		db.close();
	}
}

/**
 * The headline ratio: how many fewer full-scan forward steps SQLite performed.
 *
 * Preferred over the VM-step ratio because it is what an index actually changes, and
 * because it moved in the lesson's direction for every challenge in the bank —
 * which the step ratio did not.
 */
export function scanRatio(slow: Measurement, fast: Measurement): number {
	if (slow.fullScanSteps === 0 && fast.fullScanSteps === 0) return 1;
	return fast.fullScanSteps === 0
		? Number.POSITIVE_INFINITY
		: slow.fullScanSteps / fast.fullScanSteps;
}

/** Null when either side overflowed the 32-bit counter, since the ratio would lie. */
export function stepRatio(slow: Measurement, fast: Measurement): number | null {
	if (slow.vmStepsOverflowed || fast.vmStepsOverflowed) return null;
	return fast.vmSteps === 0
		? Number.POSITIVE_INFINITY
		: slow.vmSteps / fast.vmSteps;
}

export function timeRatio(slow: Measurement, fast: Measurement): number {
	return fast.medianMs === 0
		? Number.POSITIVE_INFINITY
		: slow.medianMs / fast.medianMs;
}

export function formatRatio(value: number | null): string {
	if (value === null) return "n/a";
	if (!Number.isFinite(value)) return "inf";
	return value >= 100 ? `${Math.round(value)}x` : `${value.toFixed(1)}x`;
}

import { SqlRequestScheduler } from "./request-scheduler";
import type {
	CompareResponse,
	DescribeResponse,
	OptimizeResponse,
	RunResponse,
	SubmitResponse,
	TableInfo,
	WalkResponse,
} from "./types";

const HARD_TIMEOUT_MS = 6000;

/**
 * Benchmarking runs the query repeatedly over a large table, and the rewrite
 * challenges are deliberately slow — the worst baseline takes ~18s per run. This
 * has to sit above the worker's own soft limit plus its sampling budget, or the
 * client would respawn a worker that was about to answer.
 */
const OPTIMIZE_TIMEOUT_MS = 90_000;

const DEFAULT_BENCHMARK_SAMPLES = 7;

function createWorker(): Worker {
	return new Worker(new URL("./worker.ts", import.meta.url), {
		type: "module",
	});
}

export interface SqlEngineClientOptions {
	workerFactory?: () => Worker;
	hardTimeoutMs?: number;
	optimizeTimeoutMs?: number;
}

export class SqlEngineClient {
	private readonly scheduler: SqlRequestScheduler;
	private readonly descriptions = new Map<string, Promise<TableInfo[]>>();
	private readonly optimizeTimeoutMs: number;

	constructor(options: SqlEngineClientOptions = {}) {
		this.scheduler = new SqlRequestScheduler({
			workerFactory: options.workerFactory ?? createWorker,
			hardTimeoutMs: options.hardTimeoutMs ?? HARD_TIMEOUT_MS,
		});
		this.optimizeTimeoutMs = options.optimizeTimeoutMs ?? OPTIMIZE_TIMEOUT_MS;
	}

	cancelScope(key: string): void {
		this.scheduler.cancelScope(key);
	}

	run(ddl: string, sql: string): Promise<RunResponse> {
		return this.scheduler.send<RunResponse>({ op: "run", ddl, sql });
	}

	submit(
		ddl: string,
		sql: string,
		referenceSql: string,
		ordered: boolean,
	): Promise<SubmitResponse> {
		return this.scheduler.send<SubmitResponse>({
			op: "submit",
			ddl,
			sql,
			referenceSql,
			ordered,
		});
	}

	optimize(
		ddl: string,
		sql: string,
		options: {
			indexes?: string[];
			samples?: number;
			matchedSql?: string;
			withStages?: boolean;
			withData?: boolean;
			supersedeKey?: string;
		} = {},
	): Promise<OptimizeResponse> {
		return this.scheduler.send<OptimizeResponse>(
			{
				op: "optimize",
				ddl,
				sql,
				indexes: options.indexes ?? [],
				samples: options.samples ?? DEFAULT_BENCHMARK_SAMPLES,
				matchedSql: options.matchedSql ?? "",
				withStages: options.withStages ?? false,
				withData: options.withData ?? false,
			},
			this.optimizeTimeoutMs,
			options.supersedeKey ?? null,
		);
	}

	compare(
		ddl: string,
		baselineSql: string,
		candidateSql: string,
		options: {
			indexes?: string[];
			samples?: number;
			supersedeKey?: string;
		} = {},
	): Promise<CompareResponse> {
		return this.scheduler.send<CompareResponse>(
			{
				op: "compare",
				ddl,
				indexes: options.indexes ?? [],
				baselineSql,
				candidateSql,
				samples: options.samples ?? DEFAULT_BENCHMARK_SAMPLES,
			},
			this.optimizeTimeoutMs,
			options.supersedeKey ?? null,
		);
	}

	walk(ddl: string, sql: string): Promise<WalkResponse> {
		return this.scheduler.send<WalkResponse>({ op: "walk", ddl, sql });
	}

	async describe(ddl: string): Promise<TableInfo[]> {
		const cached = this.descriptions.get(ddl);
		if (cached) return cached;

		const request = this.scheduler
			.send<DescribeResponse>({ op: "describe", ddl })
			.then((response) => response.tables);
		this.descriptions.set(ddl, request);
		void request.catch(() => {
			if (this.descriptions.get(ddl) === request) {
				this.descriptions.delete(ddl);
			}
		});
		return request;
	}

	dispose(): void {
		this.scheduler.dispose();
		this.descriptions.clear();
	}
}

let singleton: SqlEngineClient | null = null;

export function getSqlEngine(): SqlEngineClient {
	if (typeof window === "undefined") {
		throw new Error("getSqlEngine is browser-only");
	}
	singleton ??= new SqlEngineClient();
	return singleton;
}

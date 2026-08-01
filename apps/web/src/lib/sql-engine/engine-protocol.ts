import type { BenchmarkResult, QueryPlan } from "./plan-types";
import type { StageReport } from "./query-stage-types";
import type {
	GradeReport,
	QueryResult,
	QuerySample,
	TableInfo,
} from "./result-types";
import type { WalkResponse } from "./walk-types";

export interface RunRequest {
	id: number;
	op: "run";
	ddl: string;
	sql: string;
}

export interface SubmitRequest {
	id: number;
	op: "submit";
	ddl: string;
	sql: string;
	referenceSql: string;
	ordered: boolean;
}

export interface DescribeRequest {
	id: number;
	op: "describe";
	ddl: string;
}

export interface OptimizeRequest {
	id: number;
	op: "optimize";
	ddl: string;
	sql: string;
	indexes: string[];
	samples: number;
	matchedSql: string;
	withStages: boolean;
	withData: boolean;
}

export interface CompareRequest {
	id: number;
	op: "compare";
	ddl: string;
	indexes: string[];
	baselineSql: string;
	candidateSql: string;
	samples: number;
}

export interface WalkRequest {
	id: number;
	op: "walk";
	ddl: string;
	sql: string;
}

export type EngineRequest =
	| RunRequest
	| SubmitRequest
	| DescribeRequest
	| OptimizeRequest
	| CompareRequest
	| WalkRequest;

export interface RunResponse {
	id: number;
	op: "run";
	result: QueryResult;
}

export interface SubmitResponse {
	id: number;
	op: "submit";
	result: QueryResult;
	expected: QueryResult;
	grade: GradeReport;
}

export interface DescribeResponse {
	id: number;
	op: "describe";
	tables: TableInfo[];
}

export interface OptimizeResponse {
	id: number;
	op: "optimize";
	plan: QueryPlan;
	benchmark: BenchmarkResult;
	appliedIndexes: string[];
	matchedRows: number;
	stages: StageReport | null;
	data: { walk: WalkResponse; sample: QuerySample } | null;
}

export interface CompareResponse {
	id: number;
	op: "compare";
	baseline: BenchmarkResult;
	candidate: BenchmarkResult;
	baselinePlan: QueryPlan;
	candidatePlan: QueryPlan;
	equivalent: boolean;
	difference: string | null;
	baselineSample: QuerySample;
	candidateSample: QuerySample;
}

export interface ErrorResponse {
	id: number;
	op: "error";
	kind: "sql-error" | "timeout" | "internal";
	message: string;
}

export type EngineResponse =
	| RunResponse
	| SubmitResponse
	| DescribeResponse
	| OptimizeResponse
	| CompareResponse
	| WalkResponse
	| ErrorResponse;

export class SqlEngineError extends Error {
	constructor(
		readonly kind: ErrorResponse["kind"],
		message: string,
	) {
		super(message);
		this.name = "SqlEngineError";
	}
}

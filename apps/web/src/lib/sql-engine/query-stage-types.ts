export type StageName =
	| "input"
	| "join"
	| "where"
	| "group"
	| "having"
	| "distinct"
	| "final";

export interface StageMeasurement {
	stage: StageName;
	label: string;
	rows: number;
	atLeast: boolean;
	kind?: "table" | "cte";
	fullyScanned?: boolean;
	indexLookup?: boolean;
}

export interface StageReport {
	supported: boolean;
	blockers: string[];
	stages: StageMeasurement[];
	notes: string[];
	totalProbeMs: number;
}

export interface ParsedSelect {
	src: string;
	withPrefix: string;
	cteNames: Set<string>;
	selectList: string;
	distinct: boolean;
	aggregated: boolean;
	from: string | null;
	where: string | null;
	groupBy: string | null;
	having: string | null;
	blockers: string[];
}

export interface StageProbe {
	stage: StageName;
	label: string;
	sql: string;
	capped?: number;
	kind?: "table" | "cte";
	alias?: string;
}

export interface MeasureStagesOptions {
	count: (sql: string) => number;
	planLines: string[];
	finalRowCount: number;
	budgetMs?: number;
}

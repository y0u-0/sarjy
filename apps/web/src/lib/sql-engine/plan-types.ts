export type PlanSeverity = "good" | "warn" | "bad";

export interface QueryPlanNode {
	id: number;
	parentId: number;
	detail: string;
	label: string;
	severity: PlanSeverity;
	table: string | null;
	index: string | null;
	children: QueryPlanNode[];
}

export interface QueryPlan {
	nodes: QueryPlanNode[];
	flat: Omit<QueryPlanNode, "children">[];
	scanCount: number;
	indexedCount: number;
	temporaryBTrees: number;
}

export interface WorkCounters {
	/** Exact SQLITE_STMTSTATUS_FULLSCAN_STEP count, not a row-read count. */
	fullScanSteps: number;
	/** VM instructions executed; withheld when the 32-bit counter wraps. */
	vmSteps: number;
	vmStepsOverflowed: boolean;
	/** Sorts that needed a temporary structure. */
	sorts: number;
	/** Rows inserted into transient automatic indexes. */
	autoIndexRows: number;
}

export interface BenchmarkResult {
	medianMs: number;
	minMs: number;
	maxMs: number;
	samples: number;
	rowCount: number;
	work: WorkCounters | null;
}

export type PlanNodeStatus = "unchanged" | "improved" | "regressed" | "added";

export interface PlanDiffEntry {
	status: PlanNodeStatus;
	node: Omit<QueryPlanNode, "children"> | null;
	previous: Omit<QueryPlanNode, "children"> | null;
}

export interface PlanDiff {
	entries: PlanDiffEntry[];
	removed: Omit<QueryPlanNode, "children">[];
	headline: string | null;
}

import type { PlanSuccessCriterion } from "./optimization-bank-types";
import type { RewriteFamily } from "./rewrites";
import type { ComplexityVector } from "./types";

export const INDEX_SUCCESS: Record<string, PlanSuccessCriterion> = {
	"scan-to-seek": {
		kind: "plan",
		maxFullScanSteps: 0,
		minIndexedSteps: 1,
	},
	"sort-cost": { kind: "plan", maxSorts: 0, minIndexedSteps: 1 },
	"composite-order": { kind: "plan", maxSorts: 0, minIndexedSteps: 1 },
	"join-without-index": {
		kind: "plan",
		maxFullScanSteps: 5_000,
		minIndexedSteps: 1,
	},
	"covering-index": {
		kind: "plan",
		minIndexedSteps: 1,
		requireCoveringIndex: true,
	},
};

export const INDEX_CONCEPT_LABELS: Record<string, string> = {
	"optimization-indexes": "Index access",
	"optimization-sorting": "Avoiding sorts",
	"optimization-composite": "Composite indexes",
	"optimization-joins": "Join access paths",
	"optimization-covering": "Covering indexes",
};

export const REWRITE_CONCEPTS: Record<
	RewriteFamily,
	{ id: string; label: string; concepts: string[] }
> = {
	"correlated-subquery": {
		id: "optimization-subqueries",
		label: "Correlated work",
		concepts: ["correlation", "set-based-rewrite"],
	},
	"short-circuit": {
		id: "optimization-short-circuit",
		label: "Stopping early",
		concepts: ["short-circuit", "existence-test"],
	},
	projection: {
		id: "optimization-result-shaping",
		label: "Result shaping",
		concepts: ["projection", "top-n"],
	},
	pagination: {
		id: "optimization-pagination",
		label: "Efficient pagination",
		concepts: ["pagination", "keyset-seek"],
	},
	sargable: {
		id: "optimization-sargability",
		label: "Searchable predicates",
		concepts: ["sargability", "index-access"],
	},
	"set-operation": {
		id: "optimization-set-operations",
		label: "Set-shaped queries",
		concepts: ["set-operation", "materialization"],
	},
	aggregation: {
		id: "optimization-aggregation",
		label: "Efficient aggregation",
		concepts: ["aggregation", "pre-aggregation"],
	},
};

export const REWRITE_INDEXES: Record<string, string[]> = {
	"sargable-date": [
		"CREATE INDEX idx_purchases_date ON purchases(purchase_date)",
	],
	"sargable-arithmetic": [
		"CREATE INDEX idx_purchases_quantity ON purchases(quantity)",
	],
};

function tokenCount(sql: string): number {
	return (
		sql.match(/[a-z_][\w$]*|\d+(?:\.\d+)?|<>|>=|<=|[()*+,./=-]/gi)?.length ?? 0
	);
}

export function complexityFor(
	sql: string,
	concepts: string[],
): ComplexityVector {
	return {
		tables: Math.max(
			1,
			sql.match(/\b(?:FROM|JOIN)\s+[a-z_][\w$]*/gi)?.length ?? 0,
		),
		clauses:
			sql.match(
				/\b(?:SELECT|FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/gi,
			)?.length ?? 0,
		nestingDepth: /\(\s*SELECT\b/i.test(sql) ? 1 : 0,
		solutionTokens: tokenCount(sql),
		concepts,
	};
}

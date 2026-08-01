import type {
	PlanDiff,
	PlanDiffEntry,
	PlanSeverity,
	QueryPlan,
	QueryPlanNode,
} from "./types";

type FlatNode = Omit<QueryPlanNode, "children">;

const SEVERITY_RANK: Record<PlanSeverity, number> = {
	bad: 0,
	warn: 1,
	good: 2,
};

export interface RawPlanRow {
	id: number;
	parent: number;
	detail: string;
}

interface Classified {
	label: string;
	severity: PlanSeverity;
}

/**
 * SQLite states the interesting part of a plan step in prose, so classification
 * is pattern matching on `detail`. Order matters: the covering-index and
 * automatic-index cases both contain "INDEX", and the automatic case is a
 * warning rather than a win, so it has to be tested first.
 */
function classify(detail: string): Classified {
	const text = detail.toUpperCase();

	if (text.includes("AUTOMATIC COVERING INDEX")) {
		return {
			label: "Built a throwaway index",
			severity: "warn",
		};
	}
	if (text.startsWith("SEARCH") && text.includes("COVERING INDEX")) {
		return { label: "Covering index search", severity: "good" };
	}
	if (text.startsWith("SCAN") && text.includes("COVERING INDEX")) {
		return { label: "Full covering-index scan", severity: "warn" };
	}
	if (text.startsWith("SEARCH")) {
		return { label: "Indexed search", severity: "good" };
	}
	if (text.includes("USE TEMP B-TREE")) {
		const purpose = /USE TEMP B-TREE FOR\s+(.+)$/i.exec(detail)?.[1];
		return {
			label: purpose ? `Temporary B-tree for ${purpose}` : "Temporary B-tree",
			severity: "warn",
		};
	}
	if (text.includes("CORRELATED")) {
		return { label: "Re-runs per row", severity: "bad" };
	}
	// SCAN still means every entry is visited, even when the index supplies order.
	// It may remove a sort, but it is not a targeted lookup and should not be called
	// a seek or unconditionally labelled fast.
	if (text.startsWith("SCAN") && text.includes("USING INDEX")) {
		return { label: "Full index scan", severity: "warn" };
	}
	if (text.startsWith("SCAN")) {
		return { label: "Full table scan", severity: "bad" };
	}
	if (text.includes("BLOOM FILTER")) {
		return { label: "Bloom filter prefilter", severity: "good" };
	}
	if (text.startsWith("MATERIALIZE") || text.includes("SUBQUERY")) {
		return { label: "Materialised subquery", severity: "warn" };
	}
	return { label: "Plan step", severity: "warn" };
}

function extractTable(detail: string): string | null {
	const match = /^(?:SCAN|SEARCH)\s+(?:TABLE\s+)?([A-Za-z_][\w]*)/i.exec(
		detail,
	);
	return match?.[1] ?? null;
}

function extractIndex(detail: string): string | null {
	const match =
		/USING\s+(?:AUTOMATIC\s+)?(?:COVERING\s+)?INDEX\s+([\w]+)/i.exec(detail);
	return match?.[1] ?? null;
}

/**
 * `EXPLAIN QUERY PLAN` returns a flat list with parent pointers. Nest it so the
 * visualisation can indent nested loops the way the engine actually nests them.
 */
export function buildQueryPlan(rows: RawPlanRow[]): QueryPlan {
	const nodes = new Map<number, QueryPlanNode>();

	for (const row of rows) {
		const { label, severity } = classify(row.detail);
		nodes.set(row.id, {
			id: row.id,
			parentId: row.parent,
			detail: row.detail,
			label,
			severity,
			table: extractTable(row.detail),
			index: extractIndex(row.detail),
			children: [],
		});
	}

	const roots: QueryPlanNode[] = [];
	for (const row of rows) {
		const node = nodes.get(row.id);
		if (!node) continue;
		const parent = nodes.get(row.parent);
		if (parent && parent !== node) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}

	const flat = [...nodes.values()].map(
		({ children: _children, ...rest }) => rest,
	);

	return {
		nodes: roots,
		flat,
		scanCount: flat.filter((node) => /^SCAN\b/i.test(node.detail)).length,
		indexedCount: flat.filter(
			(node) =>
				/^SEARCH\b/i.test(node.detail) ||
				/\bUSING\s+(?:\w+\s+)*INDEX\b/i.test(node.detail),
		).length,
		temporaryBTrees: flat.filter((node) =>
			node.detail.toUpperCase().includes("USE TEMP B-TREE"),
		).length,
	};
}

/**
 * Pairs steps across two plans so the UI can show what changed rather than two
 * opaque trees.
 *
 * Steps are matched on the table they touch, because that is the thing a student
 * tracks ("what happened to the step that reads plays?"). Node ids are useless
 * for this: SQLite renumbers them freely between plans. Steps with no table —
 * temp B-trees and the like — are matched on their label instead, which is how a
 * disappearing sort gets reported as removed rather than as a mystery.
 */
export function diffPlans(
	previous: QueryPlan | null,
	current: QueryPlan,
): PlanDiff {
	if (!previous) {
		return {
			entries: current.flat.map((node) => ({
				status: "unchanged" as const,
				node,
				previous: null,
			})),
			removed: [],
			headline: null,
		};
	}

	const keyOf = (node: FlatNode): string =>
		node.table ? `table:${node.table}` : `label:${node.label}`;

	const unmatched = new Map<string, FlatNode[]>();
	for (const node of previous.flat) {
		const key = keyOf(node);
		unmatched.set(key, [...(unmatched.get(key) ?? []), node]);
	}

	const entries: PlanDiffEntry[] = current.flat.map((node) => {
		const key = keyOf(node);
		const candidates = unmatched.get(key) ?? [];
		const before = candidates.shift() ?? null;
		if (candidates.length === 0) unmatched.delete(key);
		else unmatched.set(key, candidates);

		if (!before) return { status: "added" as const, node, previous: null };
		if (before.detail === node.detail) {
			return { status: "unchanged" as const, node, previous: before };
		}
		const delta = SEVERITY_RANK[node.severity] - SEVERITY_RANK[before.severity];
		return {
			status:
				delta > 0
					? ("improved" as const)
					: delta < 0
						? ("regressed" as const)
						: ("unchanged" as const),
			node,
			previous: before,
		};
	});

	const removed = [...unmatched.values()].flat();

	const improvedTable = entries.find(
		(entry) => entry.status === "improved" && entry.node?.table,
	);
	const droppedSort = removed.find((node) =>
		node.detail.toUpperCase().includes("USE TEMP B-TREE"),
	);

	let headline: string | null = null;
	if (improvedTable?.node && improvedTable.previous) {
		headline = `${improvedTable.previous.label} on ${improvedTable.node.table} became ${improvedTable.node.label.toLowerCase()}`;
	} else if (droppedSort) {
		headline = "The temporary B-tree is gone";
	} else if (entries.some((entry) => entry.status === "regressed")) {
		headline = "That made the plan worse";
	}

	return { entries, removed, headline };
}

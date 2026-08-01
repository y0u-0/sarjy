import type { QueryPlanNode } from "@/lib/sql-engine/types";

export type OperatorVisualKind =
	| "scan"
	| "seek"
	| "sort"
	| "aggregate"
	| "join"
	| "output";

/** Maps SQLite's own plan wording to the truthful visual we can support. */
export function classifyPlanOperator(
	node: Omit<QueryPlanNode, "children"> | null,
	hasMeasuredJoin: boolean,
): OperatorVisualKind {
	const text = `${node?.label ?? ""} ${node?.detail ?? ""}`.toUpperCase();
	if (/TEMP B-TREE.*(?:ORDER BY|SORT)|\bSORT\b/.test(text)) return "sort";
	if (/TEMP B-TREE.*GROUP BY|\bAGGREGAT/.test(text)) return "aggregate";
	if (/\bSEARCH\b|\bUSING (?:COVERING )?INDEX\b|\bSEEK\b/.test(text)) {
		return "seek";
	}
	if (/\bSCAN\b/.test(text)) return "scan";
	if (hasMeasuredJoin) return "join";
	return "output";
}

/** Keep the columns that make a row legible for the current predicate/output. */
export function chooseRowColumns(
	columns: string[],
	projected: string[],
	where: string | null,
	resultColumns: string[],
	limit = 3,
): string[] {
	const lookup = new Map(
		columns.map((column) => [column.toLowerCase(), column]),
	);
	const predicateColumns =
		where?.match(/[A-Za-z_][\w$]*/g)?.map((token) => token.toLowerCase()) ?? [];
	const preferred = [
		"id",
		...projected,
		...predicateColumns,
		...resultColumns,
		"country",
		"played_at",
		...columns,
	];
	const chosen: string[] = [];
	for (const candidate of preferred) {
		const actual = lookup.get(candidate.toLowerCase());
		if (!actual || chosen.includes(actual)) continue;
		chosen.push(actual);
		if (chosen.length === limit) break;
	}
	return chosen;
}

import type { PlaygroundTable } from "@/lib/curriculum/playground";

import { extractIndexSignals } from "./index-advisor-parser";

export type CandidateKind = "equality" | "composite" | "join" | "sort";

export interface IndexCandidate {
	table: string;
	columns: string[];
	sql: string;
	reason: string;
	kind: CandidateKind;
}

function key(table: string, columns: string[]): string {
	return `${table}(${columns.join(",")})`;
}

function candidate(
	table: string,
	columns: string[],
	kind: CandidateKind,
	reason: string,
): IndexCandidate {
	return {
		table,
		columns,
		kind,
		reason,
		sql: `CREATE INDEX idx_${table}_${columns.join("_")} ON ${table}(${columns.join(", ")})`,
	};
}

export function adviseIndexes(
	sql: string,
	tables: PlaygroundTable[],
): IndexCandidate[] {
	const { filters, sorts, groups, joins } = extractIndexSignals(sql, tables);
	const out = new Map<string, IndexCandidate>();
	const add = (entry: IndexCandidate) => {
		if (!out.has(key(entry.table, entry.columns))) {
			out.set(key(entry.table, entry.columns), entry);
		}
	};
	for (const ref of filters) {
		add(
			candidate(
				ref.table,
				[ref.column],
				"equality",
				`${ref.table}.${ref.column} is filtered in the WHERE clause, so an index can jump straight to the matching rows instead of reading the whole table.`,
			),
		);
	}

	// Filter column first, then the sort column: SQLite can search for the filtered
	// value and then read those rows already in order, which removes the sort too.
	for (const filter of filters) {
		for (const sort of sorts) {
			if (sort.table !== filter.table || sort.column === filter.column)
				continue;
			add(
				candidate(
					filter.table,
					[filter.column, sort.column],
					"composite",
					`Filtering on ${filter.column} and sorting by ${sort.column}. With both in one index, in that order, SQLite searches for the filter and reads the rows already sorted — no separate sort step.`,
				),
			);
		}
	}

	for (const ref of sorts) {
		if (filters.some((filter) => filter.table === ref.table)) continue;
		add(
			candidate(
				ref.table,
				[ref.column],
				"sort",
				`ORDER BY ${ref.column} with no supporting index requires a separate temporary ordering structure. An index is already stored in order, so that step can disappear.`,
			),
		);
	}

	for (const ref of groups) {
		add(
			candidate(
				ref.table,
				[ref.column],
				"sort",
				`GROUP BY ${ref.column} has to bucket rows. Reading them already grouped by the index avoids building a temporary structure.`,
			),
		);
	}

	for (const ref of joins) {
		add(
			candidate(
				ref.table,
				[ref.column],
				"join",
				`${ref.table}.${ref.column} is a join key. Without an index SQLite may scan the whole table for every matching row, or build a throwaway index at runtime.`,
			),
		);
	}

	return [...out.values()];
}

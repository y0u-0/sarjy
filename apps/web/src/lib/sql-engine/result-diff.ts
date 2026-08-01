import { normalizeRow } from "./grade";
import type { CellValue, QueryResult } from "./types";

export type RowStatus = "match" | "missing" | "extra" | "misordered";

export interface DiffRow {
	key: string;
	status: RowStatus;
	values: Record<string, CellValue>;
	expectedAt: number | null;
	actualAt: number | null;
}

export function buildResultDiff(
	actual: QueryResult,
	expected: QueryResult,
	ordered: boolean,
): DiffRow[] {
	const actualKeys = actual.rows.map(normalizeRow);
	const expectedKeys = expected.rows.map(normalizeRow);
	const remaining = new Map<string, number[]>();
	expectedKeys.forEach((key, index) => {
		const slots = remaining.get(key) ?? [];
		slots.push(index);
		remaining.set(key, slots);
	});

	const rows: DiffRow[] = actualKeys.map((key, actualIndex) => {
		const slots = remaining.get(key);
		if (!slots || slots.length === 0) {
			return {
				key: `a${actualIndex}`,
				status: "extra",
				values: actual.rows[actualIndex],
				expectedAt: null,
				actualAt: actualIndex + 1,
			};
		}
		const expectedIndex = slots.shift() as number;
		return {
			key: `a${actualIndex}`,
			status: ordered && expectedIndex !== actualIndex ? "misordered" : "match",
			values: actual.rows[actualIndex],
			expectedAt: expectedIndex + 1,
			actualAt: actualIndex + 1,
		};
	});

	for (const slots of remaining.values()) {
		for (const expectedIndex of slots) {
			rows.push({
				key: `e${expectedIndex}`,
				status: "missing",
				values: expected.rows[expectedIndex],
				expectedAt: expectedIndex + 1,
				actualAt: null,
			});
		}
	}
	return rows;
}

export function countDiffRows(rows: DiffRow[]): Record<RowStatus, number> {
	const counts: Record<RowStatus, number> = {
		match: 0,
		missing: 0,
		extra: 0,
		misordered: 0,
	};
	for (const row of rows) counts[row.status] += 1;
	return counts;
}

import type { CellValue, WalkRow } from "@/lib/sql-engine/types";

export const JOIN_SPEEDS = [
	{ label: "0.5×", ms: 900 },
	{ label: "1×", ms: 480 },
	{ label: "2×", ms: 240 },
	{ label: "4×", ms: 110 },
] as const;

export function formatJoinCell(value: CellValue): string {
	return value === null ? "NULL" : String(value);
}

export function summariseJoinRow(row: WalkRow, columns: string[]): string {
	return columns
		.slice(0, 3)
		.map((column) => formatJoinCell(row.cells[column] ?? null))
		.join(" · ");
}

import type { CellValue } from "@/lib/sql-engine/types";

export const TABLE_WALK_SPEEDS = [
	{ label: "0.5×", ms: 420 },
	{ label: "1×", ms: 220 },
	{ label: "2×", ms: 110 },
	{ label: "4×", ms: 45 },
] as const;

export type TableRowState = "pending" | "testing" | "kept" | "rejected";

export function formatTableCell(value: CellValue): string {
	return value === null ? "NULL" : String(value);
}

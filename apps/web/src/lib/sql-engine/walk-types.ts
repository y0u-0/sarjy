import type { CellValue } from "./result-types";

export interface WalkRow {
	rowid: number;
	cells: Record<string, CellValue>;
}

export type JoinKind = "inner" | "left" | "cross" | "comma";

export interface JoinWalk {
	leftTable: string;
	leftAlias: string;
	rightTable: string;
	rightAlias: string;
	leftRows: WalkRow[];
	rightRows: WalkRow[];
	leftColumns: string[];
	rightColumns: string[];
	pairs: { left: number; right: number | null }[];
	kind: JoinKind;
	on: string | null;
}

export interface WalkResponse {
	id: number;
	op: "walk";
	supported: boolean;
	blockers: string[];
	table: string | null;
	columns: string[];
	rows: WalkRow[];
	matchedRowids: number[];
	where: string | null;
	projected: string[];
	truncated: boolean;
	join: JoinWalk | null;
}

export type CellValue = string | number | null;

export interface QueryResult {
	columns: string[];
	rows: Record<string, CellValue>[];
	rowCount: number;
	truncated: boolean;
	durationMs: number;
}

export interface QuerySample {
	columns: string[];
	rows: Record<string, CellValue>[];
	rowCount: number;
	truncated: boolean;
}

export type GradeStatus =
	| "correct"
	| "wrong-columns"
	| "wrong-row-count"
	| "wrong-order"
	| "wrong-values";

export interface GradeReport {
	pass: boolean;
	status: GradeStatus;
	message: string;
	missingColumns: string[];
	extraColumns: string[];
	expectedRowCount: number;
	actualRowCount: number;
}

export interface TableInfo {
	name: string;
	columns: { name: string; type: string }[];
	rowCount: number;
}

import { cn } from "@sarjy-sql/ui/lib/utils";

import type { CellValue, QuerySample } from "@/lib/sql-engine/types";

export const MAX_OUTPUT_ROWS = 6;

export function formatOperatorValue(value: CellValue): string {
	if (value === null) return "NULL";
	const text = String(value);
	return text.length > 24 ? `${text.slice(0, 21)}…` : text;
}

export function OperatorDataRow({
	values,
	columns,
	state,
	visible,
}: {
	values: Record<string, CellValue>;
	columns: string[];
	state: "kept" | "dropped" | "neutral";
	visible: boolean;
}) {
	return (
		<div
			className={cn(
				"min-w-0 rounded-xl border px-2.5 py-2 font-mono text-[10px] transition-[transform,opacity,background-color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
				visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
				state === "kept" && "border-lime/45 bg-lime/8",
				state === "dropped" && "border-tangerine/35 bg-tangerine/5 opacity-45",
				state === "neutral" && "border-border bg-ink",
			)}
		>
			{columns.map((column) => (
				<p key={column} className="truncate leading-4">
					<span className="text-muted-foreground">{column}=</span>
					<span className="text-foreground">
						{formatOperatorValue(values[column])}
					</span>
				</p>
			))}
		</div>
	);
}

export function ResultRows({
	sample,
	revealed,
}: {
	sample: QuerySample;
	revealed: number;
}) {
	const columns = sample.columns.slice(0, 4);
	return (
		<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
			{sample.rows.slice(0, MAX_OUTPUT_ROWS).map((row, index) => (
				<OperatorDataRow
					key={`${index}-${columns.map((column) => row[column]).join("-")}`}
					values={row}
					columns={columns}
					state="kept"
					visible={index < revealed}
				/>
			))}
		</div>
	);
}

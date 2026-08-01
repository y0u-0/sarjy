import { cn } from "@sarjy-sql/ui/lib/utils";

import type { QueryResult } from "@/lib/sql-engine/types";

interface ResultsTableProps {
	result: QueryResult;
	className?: string;
}

export function ResultsTable({ result, className }: ResultsTableProps) {
	if (result.columns.length === 0) {
		return (
			<p className="rounded-xl border border-border bg-card p-3 font-mono text-muted-foreground text-sm">
				Statement executed. No rows to display.
			</p>
		);
	}

	return (
		<div className={cn("flex min-h-0 flex-col", className)}>
			<div className="min-h-0 overflow-auto rounded-xl border border-border bg-card">
				<table className="w-full border-collapse font-mono text-xs">
					<thead className="sticky top-0 bg-ink-soft">
						<tr>
							{result.columns.map((column) => (
								<th
									key={column}
									className="border-border border-b px-2.5 py-2 text-left font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.08em]"
								>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{result.rows.map((row, rowIndex) => (
							<tr key={rowIndex} className="even:bg-foreground/[0.04]">
								{result.columns.map((column) => (
									<td key={column} className="whitespace-nowrap px-2.5 py-1">
										{row[column] === null ? (
											<span className="text-muted-foreground italic">NULL</span>
										) : (
											String(row[column])
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="pt-1.5 font-mono text-[11px] text-muted-foreground">
				{result.rowCount} row{result.rowCount === 1 ? "" : "s"}
				{result.truncated ? ` (showing first ${result.rows.length})` : ""} ·{" "}
				{result.durationMs}ms
			</p>
		</div>
	);
}

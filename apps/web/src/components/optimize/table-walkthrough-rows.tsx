import { cn } from "@sarjy-sql/ui/lib/utils";

import type { WalkResponse } from "@/lib/sql-engine/types";

import { formatTableCell } from "./table-walkthrough-model";
import type { TableWalkthroughModel } from "./use-table-walkthrough";

export function TableWalkthroughRows({
	walk,
	model,
}: {
	walk: WalkResponse;
	model: TableWalkthroughModel;
}) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
			<div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto pr-1">
				{walk.rows.map((row, index) => {
					const state = model.stateFor(index, row.rowid);
					return (
						<div
							key={row.rowid}
							className={cn(
								"flex items-center gap-2 rounded-lg border px-2 py-1 transition-colors duration-200",
								state === "pending" && "border-border/50 opacity-45",
								state === "testing" &&
									"border-amber bg-amber/20 ring-1 ring-amber",
								state === "kept" && "border-lime/60 bg-lime/12",
								state === "rejected" &&
									"border-border/40 line-through opacity-35",
							)}
						>
							<span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground">
								{index + 1}
							</span>
							<div className="flex min-w-0 flex-1 flex-wrap gap-x-2.5">
								{walk.columns.map((column) => (
									<span
										key={column}
										className={cn(
											"font-mono text-[10px]",
											model.columns.includes(column)
												? "text-foreground"
												: "text-muted-foreground/60",
										)}
									>
										{formatTableCell(row.cells[column] ?? null)}
									</span>
								))}
							</div>
						</div>
					);
				})}
			</div>
			<div className="flex flex-col gap-1">
				<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
					Result so far
				</p>
				<div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-ink p-1.5">
					{model.keptSoFar.length === 0 ? (
						<p className="p-1 text-[10px] text-muted-foreground">nothing yet</p>
					) : (
						model.keptSoFar.map((row) => (
							<div
								key={row.rowid}
								className="animate-stamp rounded-md bg-lime/10 px-1.5 py-0.5"
							>
								{model.columns.map((column) => (
									<span
										key={column}
										className="mr-2 font-mono text-[10px] text-foreground"
									>
										{formatTableCell(row.cells[column] ?? null)}
									</span>
								))}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}

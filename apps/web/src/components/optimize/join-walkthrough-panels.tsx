import { cn } from "@sarjy-sql/ui/lib/utils";

import type { JoinWalk } from "@/lib/sql-engine/types";

import { summariseJoinRow } from "./join-walkthrough-model";
import type { JoinWalkthroughModel } from "./use-join-walkthrough";

export function JoinWalkthroughPanels({
	join,
	walk,
}: {
	join: JoinWalk;
	walk: JoinWalkthroughModel;
}) {
	const panels = [
		{
			title: join.leftTable,
			rows: join.leftRows,
			columns: join.leftColumns,
			side: "left" as const,
		},
		{
			title: join.rightTable,
			rows: join.rightRows,
			columns: join.rightColumns,
			side: "right" as const,
		},
	];
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2">
			{panels.map((panel) => (
				<div key={panel.side} className="flex flex-col gap-1">
					<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
						{panel.title}
					</p>
					<div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1">
						{panel.rows.map((row) => {
							const active =
								walk.activePair !== null &&
								(panel.side === "left"
									? walk.activePair.left === row.rowid
									: walk.activePair.right === row.rowid);
							const spent =
								panel.side === "left" &&
								walk.emitted.some((pair) => pair.left === row.rowid);
							const unmatched =
								panel.side === "left" &&
								!walk.producing.has(row.rowid) &&
								(spent || walk.done);
							return (
								<div
									key={row.rowid}
									className={cn(
										"rounded-lg border px-1.5 py-1 font-mono text-[10px] transition-colors duration-200",
										active && "border-amber bg-amber/25 ring-1 ring-amber",
										!active &&
											unmatched &&
											"border-tangerine/50 bg-tangerine/10 text-tangerine",
										!active &&
											!unmatched &&
											spent &&
											"border-lime/50 bg-lime/10",
										!active && !spent && "border-border/50 opacity-45",
									)}
								>
									{summariseJoinRow(row, panel.columns)}
								</div>
							);
						})}
					</div>
				</div>
			))}
			<div className="flex flex-col gap-1">
				<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
					Output ({walk.emitted.length})
				</p>
				<div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-ink p-1.5">
					{walk.emitted.length === 0 ? (
						<p className="p-1 text-[10px] text-muted-foreground">nothing yet</p>
					) : (
						walk.emitted.map((pair, index) => {
							const left = walk.leftById.get(pair.left);
							const right =
								pair.right === null ? null : walk.rightById.get(pair.right);
							return (
								<div
									key={`${pair.left}-${pair.right}-${index}`}
									className={cn(
										"animate-stamp rounded-md px-1.5 py-0.5 font-mono text-[10px]",
										right ? "bg-lime/10 text-foreground" : "bg-tangerine/10",
									)}
								>
									{left ? summariseJoinRow(left, join.leftColumns) : "?"}
									{" + "}
									{right ? (
										summariseJoinRow(right, join.rightColumns)
									) : (
										<span className="text-tangerine">NULL</span>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}

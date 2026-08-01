import { cn } from "@sarjy-sql/ui/lib/utils";
import type { ReactNode } from "react";

import { QueryPipeline } from "@/components/optimize/query-pipeline";
import type { OperatorDataFlowProps } from "./operator-data-flow-types";
import { MAX_OUTPUT_ROWS, ResultRows } from "./operator-data-row";
import { OperatorRowsView } from "./operator-data-views";
import { JoinPairGrid } from "./operator-join-pair-grid";
import { useOperatorDataFlowModel } from "./use-operator-data-flow-model";

export function OperatorDataFlow(props: OperatorDataFlowProps) {
	const model = useOperatorDataFlowModel(props);
	return (
		<section
			className={cn("min-w-0", props.className)}
			aria-label="Measured query evidence"
		>
			<div className="flex flex-wrap items-start gap-x-3 gap-y-1 border-border border-b pb-3">
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-[10px] text-lime uppercase tracking-[0.1em]">
						Measured query evidence
					</p>
					<h3 className="mt-1 font-bold text-base">
						{model.node?.label ?? "Query output"}
					</h3>
					<p className="mt-0.5 break-words font-mono text-[11px] text-muted-foreground">
						{model.node?.detail ?? "The query's bounded real output sample."}
					</p>
				</div>
				<div className="flex flex-wrap gap-1.5 font-mono text-[10px] tabular-nums">
					{model.work && (
						<Metric>
							{model.work.fullScanSteps.toLocaleString()} full-scan steps
						</Metric>
					)}
					{props.matchedRows !== undefined && (
						<Metric accent>
							{props.matchedRows.toLocaleString()}{" "}
							{props.matchedLabel ?? "qualifying rows"}
						</Metric>
					)}
					{props.sample && (
						<Metric>{props.sample.rowCount.toLocaleString()} out</Metric>
					)}
				</div>
			</div>

			{props.focusNote && (
				<p className="border-border border-b py-3 text-foreground/85 text-sm leading-relaxed">
					{props.focusNote}
				</p>
			)}
			<div className="py-3">
				<OperatorRowsView {...model} sample={props.sample} walk={props.walk} />
			</div>

			{props.walk?.join && model.kind !== "sort" && (
				<div className="border-border border-t pt-3">
					<p className="mb-1.5 font-semibold text-[10px] text-periwinkle uppercase tracking-[0.08em]">
						Actual join pairs
					</p>
					<JoinPairGrid pairs={props.walk.join.pairs.slice(0, 6)} />
				</div>
			)}

			{props.sample && model.kind !== "sort" && model.sourceRows.length > 0 && (
				<div className="border-border border-t pt-3">
					<p className="mb-1.5 font-semibold text-[10px] text-lime uppercase tracking-[0.08em]">
						Actual query output
					</p>
					<ResultRows sample={props.sample} revealed={MAX_OUTPUT_ROWS} />
				</div>
			)}

			{props.stages && (
				<div className="mt-3 border-border border-t pt-3">
					<QueryPipeline
						report={props.stages}
						replayKey={props.replayKey}
						playback={props.playback}
					/>
				</div>
			)}

			<p className="mt-3 border-border border-t pt-2 font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
				{model.hasRealRows
					? "Every value shown came from the live SQLite fixture. EXPLAIN does not reveal physical visit order, so motion shows the operator's effect—not a fabricated trace."
					: "Counters and plan text are measured from SQLite. No row values are shown when SQLite cannot expose them truthfully."}
			</p>
		</section>
	);
}

function Metric({
	children,
	accent = false,
}: {
	children: ReactNode;
	accent?: boolean;
}) {
	return (
		<span
			className={cn(
				"rounded-full border px-2 py-1",
				accent
					? "border-lime/40 text-lime"
					: "border-border text-muted-foreground",
			)}
		>
			{children}
		</span>
	);
}

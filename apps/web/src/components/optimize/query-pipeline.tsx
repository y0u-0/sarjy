import { cn } from "@sarjy-sql/ui/lib/utils";
import { Info } from "lucide-react";

import type { TimelineVisualPlayback } from "@/lib/optimize/timeline";
import type { StageReport } from "@/lib/sql-engine/query-stages";

import { QueryPipelineStage } from "./query-pipeline-stage";
import { usePipelineReveal } from "./use-pipeline-reveal";

interface QueryPipelineProps {
	report: StageReport | null;
	replayKey: number;
	playback?: TimelineVisualPlayback;
	className?: string;
}

export function QueryPipeline({
	report,
	replayKey,
	playback = "playing",
	className,
}: QueryPipelineProps) {
	const stages = report?.stages ?? [];
	const revealed = usePipelineReveal(stages.length, replayKey, playback);

	if (!report?.supported) {
		return (
			<div
				className={cn(
					"rounded-2xl border border-border border-dashed p-4",
					className,
				)}
			>
				<p className="text-muted-foreground text-xs leading-relaxed">
					{report?.blockers.length
						? `The row funnel does not apply to this query shape (${report.blockers.join(", ")}). The plan and timing above are still accurate.`
						: "Run a query to see how many rows survive each stage."}
				</p>
			</div>
		);
	}

	const widest = Math.max(1, ...stages.map((stage) => stage.rows));
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex flex-wrap items-center gap-1.5">
				<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
					Rows through the pipeline
				</p>
				<span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
					not the order you wrote it
				</span>
			</div>

			<ol className="flex flex-col gap-1">
				{stages.map((stage, index) => (
					<QueryPipelineStage
						key={`${stage.stage}-${stage.label}`}
						stage={stage}
						previous={index === 0 ? null : (stages[index - 1] ?? null)}
						visible={index < revealed}
						showArrow={index > 0}
						widest={widest}
					/>
				))}
			</ol>

			{report.notes.length > 0 && (
				<div className="flex flex-col gap-1">
					{report.notes.map((note) => (
						<p
							key={note}
							className="flex items-start gap-1.5 rounded-xl border border-amber/40 bg-amber/10 px-2.5 py-1.5 text-[11px] text-foreground leading-relaxed"
						>
							<Info className="mt-0.5 size-3 shrink-0 text-amber" />
							{note}
						</p>
					))}
				</div>
			)}

			<p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
				These are the stages SQL <em>defines</em>, each counted by running it
				for real. SQLite is free to reorder internally, so this is the shape of
				the language, not a trace of the engine.
			</p>
		</div>
	);
}

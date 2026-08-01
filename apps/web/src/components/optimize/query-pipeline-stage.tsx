import { cn } from "@sarjy-sql/ui/lib/utils";
import { ArrowDown, Search } from "lucide-react";
import type { ReactNode } from "react";

import type { StageMeasurement } from "@/lib/sql-engine/query-stages";

import {
	describePipelineDelta,
	formatPipelineRows,
	STAGE_META,
} from "./query-pipeline-model";

export function QueryPipelineStage({
	stage,
	previous,
	visible,
	showArrow,
	widest,
}: {
	stage: StageMeasurement;
	previous: StageMeasurement | null;
	visible: boolean;
	showArrow: boolean;
	widest: number;
}) {
	const meta = STAGE_META[stage.stage];
	const Icon = stage.indexLookup ? Search : meta.icon;
	const delta = describePipelineDelta(stage, previous);
	const width = Math.max(2, (stage.rows / widest) * 100);

	return (
		<li className="flex flex-col gap-1">
			{showArrow && (
				<ArrowDown
					className={cn(
						"ml-4 size-3 shrink-0 text-muted-foreground/50 transition-opacity duration-300",
						visible ? "opacity-100" : "opacity-0",
					)}
					aria-hidden
				/>
			)}
			<div
				className={cn(
					"rounded-2xl border border-border bg-ink-soft p-3 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:translate-y-0",
					visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
				)}
			>
				<div className="flex flex-wrap items-center gap-2">
					<Icon className={cn("size-3.5 shrink-0", meta.tint)} />
					<p className="font-semibold text-foreground text-sm">{stage.label}</p>
					{stage.kind === "cte" && <Badge>CTE</Badge>}
					{stage.indexLookup && (
						<Badge tone="good">index lookup, not a full read</Badge>
					)}
					{stage.fullyScanned && <Badge tone="warn">read in full</Badge>}
					{delta.text && (
						<DeltaBadge tone={delta.tone}>{delta.text}</DeltaBadge>
					)}
				</div>
				<div className="mt-2 flex items-center gap-2">
					<p className="w-28 shrink-0 font-mono text-foreground text-sm">
						{formatPipelineRows(stage)}{" "}
						<span className="text-muted-foreground text-xs">
							row{stage.rows === 1 ? "" : "s"}
						</span>
					</p>
					<div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
						<div
							className={cn(
								"h-full origin-left rounded-full transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
								meta.bar,
							)}
							style={{ transform: `scaleX(${visible ? width / 100 : 0})` }}
						/>
					</div>
				</div>
			</div>
		</li>
	);
}

function Badge({
	children,
	tone,
}: {
	children: ReactNode;
	tone?: "good" | "warn";
}) {
	return (
		<span
			className={cn(
				"rounded-full border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-[0.08em]",
				tone === "good"
					? "border-lime/60 bg-lime/15 text-lime"
					: tone === "warn"
						? "border-tangerine/60 bg-tangerine/15 text-tangerine"
						: "border-border bg-foreground/10 text-muted-foreground",
			)}
		>
			{children}
		</span>
	);
}

function DeltaBadge({ children, tone }: { children: ReactNode; tone: string }) {
	return (
		<span
			className={cn(
				"ml-auto rounded-full border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-[0.08em]",
				tone === "fanout" && "border-amber/60 bg-amber/15 text-amber",
				tone === "drop" && "border-lime/60 bg-lime/15 text-lime",
				tone === "same" && "border-border text-muted-foreground",
			)}
		>
			{children}
		</span>
	);
}

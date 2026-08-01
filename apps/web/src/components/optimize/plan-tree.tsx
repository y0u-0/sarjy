import { cn } from "@sarjy-sql/ui/lib/utils";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	ScanLine,
	Sparkles,
} from "lucide-react";

import type {
	PlanDiff,
	PlanNodeStatus,
	PlanSeverity,
	QueryPlan,
	QueryPlanNode,
} from "@/lib/sql-engine/types";

const SEVERITY_STYLES: Record<PlanSeverity, { chip: string; label: string }> = {
	bad: {
		chip: "border-tangerine/60 bg-tangerine/15 text-tangerine",
		label: "Costly shape",
	},
	warn: {
		chip: "border-amber/60 bg-amber/15 text-amber",
		label: "Inspect",
	},
	good: {
		chip: "border-lime/60 bg-lime/15 text-lime",
		label: "Targeted",
	},
};

function SeverityIcon({ severity }: { severity: PlanSeverity }) {
	if (severity === "good") return <CheckCircle2 className="size-3.5" />;
	if (severity === "warn") return <AlertTriangle className="size-3.5" />;
	return <ScanLine className="size-3.5" />;
}

interface PlanNodeRowProps {
	node: QueryPlanNode;
	depth: number;
	focusedId: number | null;
	focusNote: string | null;
	diff: PlanDiff | null;
}

function PlanNodeRow({
	node,
	depth,
	focusedId,
	focusNote,
	diff,
}: PlanNodeRowProps) {
	const styles = SEVERITY_STYLES[node.severity];
	const isFocused = focusedId === node.id;
	const entry = diff?.entries.find((item) => item.node?.id === node.id) ?? null;
	const status: PlanNodeStatus = entry?.status ?? "unchanged";
	const changed = status === "improved" || status === "regressed";

	return (
		<li>
			<div
				className={cn(
					"relative flex flex-col gap-1 rounded-2xl p-3 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
					isFocused
						? "bg-periwinkle/10"
						: status === "improved"
							? "animate-stamp bg-lime/10"
							: status === "regressed"
								? "animate-stamp bg-tangerine/10"
								: "bg-ink-soft",
				)}
				style={{ marginLeft: depth * 18 }}
			>
				<div className="flex flex-wrap items-center gap-2 pl-2">
					<span
						className={cn(
							"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-[0.08em]",
							styles.chip,
						)}
					>
						<SeverityIcon severity={node.severity} />
						{styles.label}
					</span>
					<p className="font-semibold text-foreground text-sm">{node.label}</p>
					{node.table && (
						<span className="rounded-full bg-foreground/10 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
							{node.table}
						</span>
					)}
					{status === "added" && (
						<span className="inline-flex items-center gap-1 rounded-full border border-sky/60 bg-sky/15 px-2 py-0.5 font-semibold text-[10px] text-sky uppercase tracking-[0.08em]">
							<Sparkles className="size-3" /> new
						</span>
					)}
				</div>

				{changed && entry?.previous && (
					<p className="flex flex-wrap items-center gap-1.5 pl-2 font-mono text-[11px]">
						<span className="text-muted-foreground/70 line-through">
							{entry.previous.detail}
						</span>
						<ArrowRight
							className={cn(
								"size-3 shrink-0",
								status === "improved" ? "text-lime" : "text-tangerine",
							)}
						/>
					</p>
				)}

				<p className="pl-2 font-mono text-[11px] text-muted-foreground leading-relaxed">
					{node.detail}
				</p>

				{isFocused && focusNote && (
					<p className="ml-2 animate-stamp rounded-xl border border-periwinkle/50 bg-periwinkle/15 px-2.5 py-1.5 text-foreground text-xs">
						{focusNote}
					</p>
				)}
			</div>

			{node.children.length > 0 && (
				<ul className="mt-1.5 flex flex-col gap-1.5">
					{node.children.map((child) => (
						<PlanNodeRow
							key={child.id}
							node={child}
							depth={depth + 1}
							focusedId={focusedId}
							focusNote={focusNote}
							diff={diff}
						/>
					))}
				</ul>
			)}
		</li>
	);
}

interface PlanTreeProps {
	plan: QueryPlan | null;
	diff?: PlanDiff | null;
	/** Plan node Sarjy is currently pointing at, or null. */
	focusedId?: number | null;
	focusNote?: string | null;
	className?: string;
}

export function PlanTree({
	plan,
	diff = null,
	focusedId = null,
	focusNote = null,
	className,
}: PlanTreeProps) {
	if (!plan) {
		return (
			<div
				className={cn(
					"flex items-center justify-center rounded-2xl border border-border border-dashed p-8",
					className,
				)}
			>
				<p className="text-center text-muted-foreground text-xs">
					Run the query to see how SQLite plans to answer it.
				</p>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex flex-wrap items-center gap-1.5">
				<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
					Query plan
				</p>
				{plan.scanCount > 0 && (
					<span className="rounded-full border border-tangerine/60 bg-tangerine/15 px-2 py-0.5 font-semibold text-[10px] text-tangerine uppercase tracking-[0.08em]">
						{plan.scanCount} full scan{plan.scanCount > 1 ? "s" : ""}
					</span>
				)}
				{plan.temporaryBTrees > 0 && (
					<span className="rounded-full border border-amber/60 bg-amber/15 px-2 py-0.5 font-semibold text-[10px] text-amber uppercase tracking-[0.08em]">
						{plan.temporaryBTrees} temp B-tree
					</span>
				)}
				{plan.indexedCount > 0 && (
					<span className="rounded-full border border-lime/60 bg-lime/15 px-2 py-0.5 font-semibold text-[10px] text-lime uppercase tracking-[0.08em]">
						{plan.indexedCount} index path{plan.indexedCount > 1 ? "s" : ""}
					</span>
				)}
			</div>

			{diff?.headline && (
				<p className="animate-stamp rounded-xl border border-lime bg-lime px-3 py-1.5 font-semibold text-ink text-xs">
					{diff.headline}
				</p>
			)}

			<ul className="flex flex-col gap-1.5">
				{plan.nodes.map((node) => (
					<PlanNodeRow
						key={node.id}
						node={node}
						depth={0}
						focusedId={focusedId}
						focusNote={focusNote}
						diff={diff}
					/>
				))}
			</ul>

			{diff && diff.removed.length > 0 && (
				<div className="flex flex-col gap-1.5">
					{diff.removed.map((node) => (
						<div
							key={`${node.id}-${node.detail}`}
							className="rounded-2xl border border-border border-dashed p-3 opacity-60"
						>
							<div className="flex items-center gap-2">
								<span className="rounded-full border border-lime/60 bg-lime/15 px-2 py-0.5 font-semibold text-[10px] text-lime uppercase tracking-[0.08em]">
									gone
								</span>
								<p className="font-semibold text-muted-foreground text-sm line-through">
									{node.label}
								</p>
							</div>
							<p className="mt-1 font-mono text-[11px] text-muted-foreground/70 line-through">
								{node.detail}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

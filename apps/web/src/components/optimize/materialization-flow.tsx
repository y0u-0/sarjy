import { cn } from "@sarjy-sql/ui/lib/utils";
import { ArrowRight, Database, GitFork, Layers3, Table2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

function revealTarget(stepId: string | undefined): number {
	if (stepId === "apply-change") return 2;
	if (stepId === "candidate-plan") return 3;
	if (stepId === "compare-work" || stepId === "reflect") return 4;
	return 1;
}

interface FlowNodeProps {
	icon: typeof Database;
	title: string;
	detail: string;
	visible: boolean;
	tone?: "source" | "work" | "summary" | "result";
}

function FlowNode({
	icon: Icon,
	title,
	detail,
	visible,
	tone = "source",
}: FlowNodeProps) {
	return (
		<div
			className={cn(
				"min-w-0 rounded-xl border bg-ink px-3 py-2 transition-[transform,opacity,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
				visible ? "scale-100 opacity-100" : "scale-95 opacity-20",
				tone === "source" && "border-sky/50",
				tone === "work" && "border-amber/50",
				tone === "summary" && "border-periwinkle/60",
				tone === "result" && "border-lime/50",
			)}
		>
			<div className="flex items-center gap-1.5">
				<Icon className="size-3.5 shrink-0 text-muted-foreground" />
				<p className="truncate font-semibold text-xs">{title}</p>
			</div>
			<p className="mt-1 font-mono text-[10px] text-muted-foreground">
				{detail}
			</p>
		</div>
	);
}

function Connector({ visible }: { visible: boolean }) {
	return (
		<ArrowRight
			className={cn(
				"size-4 shrink-0 transition-[transform,opacity] duration-200 motion-reduce:transition-none max-sm:rotate-90",
				visible ? "translate-x-0 opacity-70" : "-translate-x-1 opacity-15",
			)}
			aria-hidden
		/>
	);
}

/**
 * An agent-controlled visual argument for the CTAS lesson. The figures come from
 * the authored dataset; the benchmark beside it remains the source of truth for
 * the work SQLite actually performed.
 */
export function MaterializationFlow({
	activeStepId,
	replayKey,
}: {
	activeStepId: string | undefined;
	replayKey: number;
}) {
	const reducedMotion = useReducedMotion();
	const target = revealTarget(activeStepId);
	const [revealed, setRevealed] = useState(reducedMotion ? target : 0);

	useEffect(() => {
		void replayKey;
		if (reducedMotion) {
			setRevealed(target);
			return;
		}
		setRevealed((current) => Math.min(current, target));
	}, [reducedMotion, replayKey, target]);

	useEffect(() => {
		if (reducedMotion || revealed >= target) return;
		const timer = setTimeout(
			() => setRevealed((current) => Math.min(target, current + 1)),
			140,
		);
		return () => clearTimeout(timer);
	}, [reducedMotion, revealed, target]);

	const candidateActive = revealed >= 2;

	return (
		<section className="rounded-2xl border border-border bg-ink-soft p-4">
			<div className="flex flex-wrap items-center gap-2">
				<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
					Materialization flow
				</p>
				<span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
					build cost included
				</span>
			</div>

			<div
				className={cn(
					"mt-3 rounded-xl border border-tangerine/35 bg-tangerine/5 p-3 transition-opacity duration-200 motion-reduce:transition-none",
					candidateActive ? "opacity-45" : "opacity-100",
				)}
			>
				<p className="mb-2 text-[10px] text-tangerine uppercase tracking-[0.08em]">
					Before · repeat the expensive stage
				</p>
				<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] items-center gap-2 max-sm:grid-cols-1">
					<FlowNode
						icon={Database}
						title="tracks"
						detail="60,000 rows"
						visible
					/>
					<Connector visible />
					<div className="grid grid-cols-2 gap-2">
						<FlowNode
							icon={Layers3}
							title="GROUP BY #1"
							detail="for SUM"
							visible
							tone="work"
						/>
						<FlowNode
							icon={Layers3}
							title="GROUP BY #2"
							detail="for MAX"
							visible
							tone="work"
						/>
					</div>
				</div>
			</div>

			<div className="mt-2 rounded-xl border border-periwinkle/40 bg-periwinkle/5 p-3">
				<p className="mb-2 text-[10px] text-periwinkle uppercase tracking-[0.08em]">
					After · persist once, reuse twice
				</p>
				<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.2fr)] items-center gap-2 max-lg:grid-cols-1">
					<FlowNode
						icon={Database}
						title="tracks"
						detail="60,000 rows"
						visible={candidateActive}
					/>
					<Connector visible={candidateActive} />
					<FlowNode
						icon={Layers3}
						title="GROUP BY once"
						detail="one build pass"
						visible={candidateActive}
						tone="work"
					/>
					<Connector visible={revealed >= 3} />
					<FlowNode
						icon={Table2}
						title="album_track_counts"
						detail="10,000 summary rows"
						visible={revealed >= 3}
						tone="summary"
					/>
					<Connector visible={revealed >= 4} />
					<FlowNode
						icon={GitFork}
						title="SUM + MAX"
						detail="two cheap reuses"
						visible={revealed >= 4}
						tone="result"
					/>
				</div>
			</div>
			<p className="mt-2 text-[10px] text-muted-foreground leading-relaxed">
				This is a teaching diagram of the SQL program. The plan tree and work
				counters are measured from SQLite; the candidate counter includes CREATE
				TABLE AS SELECT plus both reads.
			</p>
		</section>
	);
}

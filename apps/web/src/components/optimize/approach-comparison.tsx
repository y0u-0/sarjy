import { cn } from "@sarjy-sql/ui/lib/utils";

import type { OptimizationApproach } from "@/lib/optimize/approaches";

const FIT_LABELS: Record<OptimizationApproach["fit"], string> = {
	best: "Best fit here",
	viable: "Also viable",
	situational: "Depends",
	poor: "Poor fit here",
};

const FIT_STYLES: Record<OptimizationApproach["fit"], string> = {
	best: "border-lime/55 bg-lime/8 text-lime",
	viable: "border-periwinkle/55 bg-periwinkle/8 text-periwinkle",
	situational: "border-amber/55 bg-amber/8 text-amber",
	poor: "border-border bg-foreground/5 text-muted-foreground",
};

export function ApproachComparison({
	approaches,
	className,
}: {
	approaches: readonly OptimizationApproach[];
	className?: string;
}) {
	return (
		<section
			className={cn("space-y-3", className)}
			aria-label="Alternative optimization approaches"
		>
			<div>
				<p className="font-semibold text-[10px] text-periwinkle uppercase tracking-[0.1em]">
					Other approaches
				</p>
				<h3 className="mt-1 font-bold text-base">
					Why this change—and what else?
				</h3>
				<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
					These options are specific to this query. The goal is to choose from
					evidence, not memorize one optimization rule.
				</p>
			</div>

			<div className="grid gap-2 md:grid-cols-2">
				{approaches.map((approach) => (
					<article
						key={`${approach.technique}-${approach.title}`}
						className="rounded-2xl border border-border bg-ink p-3"
					>
						<div className="flex flex-wrap items-center gap-1.5">
							<span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
								{approach.technique}
							</span>
							<span
								className={cn(
									"rounded-full border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-[0.06em]",
									FIT_STYLES[approach.fit],
								)}
							>
								{FIT_LABELS[approach.fit]}
							</span>
						</div>
						<h4 className="mt-2 font-semibold text-sm">{approach.title}</h4>
						<p className="mt-1 text-foreground/85 text-xs leading-relaxed">
							{approach.effect}
						</p>
						<p className="mt-2 border-border border-t pt-2 text-[11px] text-muted-foreground leading-relaxed">
							Trade-off: {approach.tradeoff}
						</p>
					</article>
				))}
			</div>
		</section>
	);
}

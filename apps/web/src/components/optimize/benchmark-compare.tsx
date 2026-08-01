import { cn } from "@sarjy-sql/ui/lib/utils";

import type { BenchmarkResult } from "@/lib/sql-engine/types";

import { BenchmarkMetricRow } from "./benchmark-metric-row";
import { describeBenchmarkChange } from "./benchmark-verdict";

export function BenchmarkCompare({
	baseline,
	current,
	className,
}: {
	baseline: BenchmarkResult | null;
	current: BenchmarkResult | null;
	className?: string;
}) {
	if (!baseline) {
		return (
			<div
				className={cn(
					"rounded-2xl border border-border border-dashed p-6 text-center",
					className,
				)}
			>
				<p className="text-muted-foreground text-xs">
					No measurement yet. Run the query to set a baseline.
				</p>
			</div>
		);
	}

	const hasComparison = current !== null && current !== baseline;
	const before = baseline.work?.fullScanSteps ?? 0;
	const after = current?.work?.fullScanSteps ?? 0;
	const ceiling = Math.max(before, after, 1);

	const verdict = hasComparison
		? describeBenchmarkChange(baseline, current)
		: null;

	return (
		<div
			className={cn(
				"flex flex-col gap-3 rounded-2xl border border-border bg-ink-soft p-4",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<p className="font-semibold text-foreground text-sm">Work done</p>
				{verdict && (
					<span
						className={cn(
							"animate-stamp rounded-full border px-2.5 py-0.5 font-semibold text-[11px] text-ink uppercase tracking-[0.08em]",
							verdict.good
								? "border-lime bg-lime"
								: "border-tangerine bg-tangerine",
						)}
					>
						{verdict.label}
					</span>
				)}
			</div>

			<BenchmarkMetricRow
				label="Before"
				benchmark={baseline}
				ceiling={ceiling}
				tone="slow"
			/>

			{hasComparison && (
				<BenchmarkMetricRow
					label="After"
					benchmark={current}
					ceiling={ceiling}
					tone="fast"
				/>
			)}

			{verdict?.note && (
				<p className="border-border border-t pt-2 text-[11px] text-muted-foreground leading-relaxed">
					{verdict.note}
				</p>
			)}
		</div>
	);
}

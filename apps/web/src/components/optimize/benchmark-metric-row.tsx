import { cn } from "@sarjy-sql/ui/lib/utils";

import type { BenchmarkResult } from "@/lib/sql-engine/types";

import { barScale, formatCount, formatMs } from "./benchmark-format";

export function BenchmarkMetricRow({
	label,
	benchmark,
	ceiling,
	tone,
}: {
	label: string;
	benchmark: BenchmarkResult;
	ceiling: number;
	tone: "slow" | "fast";
}) {
	const scanned = benchmark.work?.fullScanSteps ?? 0;

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-baseline justify-between gap-2">
				<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
					{label}
				</p>
				<p
					className={cn(
						"font-mono text-sm tabular-nums",
						tone === "fast" ? "text-lime" : "text-foreground",
					)}
				>
					{benchmark.work
						? `${formatCount(scanned)} full-scan step${scanned === 1 ? "" : "s"}`
						: formatMs(benchmark.medianMs)}
				</p>
			</div>

			<div className="h-2.5 overflow-hidden rounded-full bg-foreground/10">
				<div
					className={cn(
						"h-full origin-left rounded-full transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						tone === "fast" ? "bg-lime" : "bg-tangerine",
					)}
					style={{ transform: `scaleX(${barScale(scanned, ceiling)})` }}
				/>
			</div>

			<p className="flex flex-wrap gap-x-2 font-mono text-[10px] text-muted-foreground">
				<span>
					{benchmark.rowCount.toLocaleString()} row
					{benchmark.rowCount === 1 ? "" : "s"} out
				</span>
				{benchmark.work && !benchmark.work.vmStepsOverflowed && (
					<span>· {formatCount(benchmark.work.vmSteps)} steps</span>
				)}
				{benchmark.work?.vmStepsOverflowed && (
					<span title="The step counter is a 32-bit integer and this query exceeded it.">
						· over 2.1B steps
					</span>
				)}
				{benchmark.work && benchmark.work.sorts > 0 && (
					<span className="text-tangerine">· sorted</span>
				)}
				{benchmark.work && benchmark.work.autoIndexRows > 0 && (
					<span className="text-tangerine">
						· {formatCount(benchmark.work.autoIndexRows)} automatic-index rows
					</span>
				)}
				<span>
					· {formatMs(benchmark.medianMs)} (median of {benchmark.samples})
				</span>
			</p>
		</div>
	);
}

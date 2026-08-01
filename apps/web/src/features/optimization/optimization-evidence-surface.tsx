import { cn } from "@sarjy-sql/ui/lib/utils";

import { MaterializationFlow } from "@/components/optimize/materialization-flow";
import { OperatorDataFlow } from "@/components/optimize/operator-data-flow";
import { PlanTree } from "@/components/optimize/plan-tree";
import { approachesForProblem } from "@/lib/optimize/approaches";
import type { QuerySample } from "@/lib/sql-engine/types";

import type { OptimizationCanvasProps } from "./optimization-canvas";
import { OptimizationOutcomePanel } from "./optimization-outcome-panel";

export function PlanAndRowsSurface(props: OptimizationCanvasProps) {
	if (props.surface === "plan") {
		return (
			<div className="mx-auto max-w-3xl">
				<PlanTree
					plan={props.visibleMeasurement?.plan ?? null}
					diff={props.visibleDiff}
					focusedId={props.focusedId}
					focusNote={props.focusNote}
				/>
			</div>
		);
	}

	if (props.problem.mode === "rewrite" && props.problem.technique === "ctas") {
		return (
			<div className="mx-auto max-w-3xl">
				<MaterializationFlow
					activeStepId={props.activeStep?.id}
					replayKey={props.replayKey}
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl">
			<OperatorDataFlow
				plan={props.visibleMeasurement?.plan ?? null}
				benchmark={props.visibleMeasurement?.benchmark ?? null}
				focusedId={props.focusedId}
				focusNote={props.focusNote}
				walk={props.visibleMeasurement?.walk ?? null}
				sample={props.visibleMeasurement?.sample ?? null}
				stages={props.visibleMeasurement?.stages ?? null}
				matchedRows={props.visibleMeasurement?.matchedRows}
				matchedLabel={
					props.problem.mode === "index"
						? props.problem.illustration.matchedLabel
						: undefined
				}
				replayKey={props.replayKey}
				playback={props.operatorPlayback}
			/>
		</div>
	);
}

export function ComparisonSurface(props: OptimizationCanvasProps) {
	if (props.responseGate === "correctness") {
		return (
			<ResultComparison
				baseline={props.baseline?.sample ?? null}
				candidate={props.candidate?.sample ?? null}
			/>
		);
	}

	if (props.responseGate === "comparison") {
		return <MeasuredPlanChange {...props} />;
	}

	if (props.responseGate === "alternative-review") {
		return <SingleAlternative {...props} />;
	}

	if (props.responseGate === "teachback") {
		return (
			<div className="mx-auto max-w-2xl py-8 text-center">
				<p className="font-semibold text-lime text-xs uppercase tracking-[0.1em]">
					No more reveals
				</p>
				<p className="mt-2 font-bold text-2xl leading-tight tracking-tight">
					Explain it back to Sarjy in your own words.
				</p>
			</div>
		);
	}

	if (props.lessonCheckpoint === "complete") {
		return (
			<div className="mx-auto max-w-3xl">
				<OptimizationOutcomePanel
					problem={props.problem}
					outcome={props.outcome}
				/>
			</div>
		);
	}

	return (
		<div className="py-8 text-center text-muted-foreground text-sm">
			Sarjy is preparing the next single piece of evidence.
		</div>
	);
}

function ResultComparison({
	baseline,
	candidate,
}: {
	baseline: QuerySample | null;
	candidate: QuerySample | null;
}) {
	return (
		<div className="grid gap-3 md:grid-cols-2">
			<ResultSample label="Before" sample={baseline} />
			<ResultSample label="After" sample={candidate} />
		</div>
	);
}

function ResultSample({
	label,
	sample,
}: {
	label: string;
	sample: QuerySample | null;
}) {
	const columns = sample?.columns.slice(0, 4) ?? [];
	return (
		<section className="min-w-0 rounded-2xl bg-ink p-3 shadow-[inset_0_0_0_1px_var(--border)]">
			<div className="mb-2 flex items-center justify-between gap-2">
				<p className="font-semibold text-xs uppercase tracking-[0.08em]">
					{label}
				</p>
				<span className="font-mono text-[10px] text-muted-foreground tabular-nums">
					{sample ? `${sample.rowCount.toLocaleString()} rows` : "Measuring"}
				</span>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse font-mono text-[11px]">
					<thead>
						<tr className="text-left text-muted-foreground">
							{columns.map((column) => (
								<th key={column} className="border-border border-b px-2 py-1.5">
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{sample?.rows.slice(0, 4).map((row, index) => (
							<tr key={`${label}-${index}`}>
								{columns.map((column) => (
									<td
										key={column}
										className="border-border/60 border-b px-2 py-1.5"
									>
										{String(row[column] ?? "NULL")}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

function MeasuredPlanChange(props: OptimizationCanvasProps) {
	const before = props.baseline?.benchmark.work?.fullScanSteps;
	const after = props.candidate?.benchmark.work?.fullScanSteps;
	return (
		<div className="mx-auto max-w-3xl space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-periwinkle/10 px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--periwinkle)]">
				<p className="text-sm">
					{props.visibleDiff?.headline ?? "Measured plan change"}
				</p>
				{before !== undefined && after !== undefined && (
					<span className="font-mono text-xs tabular-nums">
						{before.toLocaleString()} → {after.toLocaleString()} scan steps
					</span>
				)}
			</div>
			<PlanTree
				plan={props.candidate?.plan ?? null}
				diff={props.visibleDiff}
				focusedId={props.focusedId}
				focusNote={props.focusNote}
			/>
		</div>
	);
}

function SingleAlternative(props: OptimizationCanvasProps) {
	const approaches = approachesForProblem(props.problem);
	const approach =
		approaches.find((entry) => entry.fit === "viable") ??
		approaches.find((entry) => entry.fit === "situational") ??
		approaches.find((entry) => entry.fit !== "best") ??
		approaches[0];
	if (!approach) return null;
	return (
		<article className="mx-auto max-w-2xl rounded-2xl bg-ink p-5 shadow-[inset_0_0_0_1px_var(--border)]">
			<div className="flex flex-wrap items-center gap-2">
				<span className="rounded-full bg-periwinkle/15 px-2.5 py-1 font-mono text-[10px] text-periwinkle">
					{approach.technique}
				</span>
				<span
					className={cn(
						"font-semibold text-[10px] uppercase tracking-[0.08em]",
						approach.fit === "poor" ? "text-tangerine" : "text-lime",
					)}
				>
					{approach.fit}
				</span>
			</div>
			<h3 className="mt-3 font-bold text-xl tracking-tight">
				{approach.title}
			</h3>
			<p className="mt-2 text-foreground/85 text-sm leading-relaxed">
				{approach.effect}
			</p>
			<p className="mt-4 text-muted-foreground text-xs leading-relaxed">
				Trade-off: {approach.tradeoff}
			</p>
		</article>
	);
}

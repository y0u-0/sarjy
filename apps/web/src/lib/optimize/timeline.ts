import type { OptimizationLabProblem } from "@/lib/curriculum/optimization-bank";
import type {
	BenchmarkResult,
	PlanDiff,
	QueryPlan,
} from "@/lib/sql-engine/types";

export type TimelineLayer =
	| "query"
	| "plan"
	| "rows"
	| "change"
	| "compare"
	| "reflect";

export type TimelineVisualPlayback = "idle" | "playing" | "paused" | "complete";

export interface OptimizationTimelineStep {
	id: string;
	layer: TimelineLayer;
	eyebrow: string;
	title: string;
	description: string;
	/** The same id consumed by PlanTree, keeping the visual layers synchronized. */
	planNodeId: number | null;
	/** A compact metric for the active layer, never an invented planner cost. */
	metric: string | null;
}

interface TimelineMeasurement {
	plan: QueryPlan;
	benchmark: BenchmarkResult;
	matchedRows?: number;
}

interface BuildTimelineInput {
	problem: OptimizationLabProblem;
	baseline: TimelineMeasurement | null;
	candidate: TimelineMeasurement | null;
	diff: PlanDiff | null;
	changeApplied: boolean;
}

function formatWork(benchmark: BenchmarkResult): string {
	const scans = benchmark.work?.fullScanSteps;
	if (scans !== undefined) return `${scans.toLocaleString()} full-scan steps`;
	return `${benchmark.medianMs}ms median`;
}

function importantNode(
	plan: QueryPlan | null,
	preferBad = true,
): number | null {
	if (!plan) return null;
	const node = preferBad
		? (plan.flat.find((entry) => entry.severity === "bad") ?? plan.flat[0])
		: (plan.flat.find((entry) => entry.severity === "good") ?? plan.flat[0]);
	return node?.id ?? null;
}

function changeLabel(problem: OptimizationLabProblem): string {
	if (problem.mode === "index") return "Apply the schema change";
	return problem.technique === "ctas"
		? "Build the summary once"
		: "Run the candidate rewrite";
}

/**
 * Builds a small, deterministic lesson from measurements we actually own.
 *
 * This is intentionally not presented as a physical row-by-row SQLite trace.
 * SQLite may reorder work, while EXPLAIN QUERY PLAN only exposes the chosen plan.
 * The timeline therefore synchronizes real plan nodes and counters with bounded
 * rows captured from the same fixture. Row values and predicate membership are
 * real; motion explains the operator without pretending to expose visit order.
 */
export function buildOptimizationTimeline({
	problem,
	baseline,
	candidate,
	diff,
	changeApplied,
}: BuildTimelineInput): OptimizationTimelineStep[] {
	const baselineNode = importantNode(baseline?.plan ?? null);
	const candidateNode = importantNode(candidate?.plan ?? null, false);
	const steps: OptimizationTimelineStep[] = [
		{
			id: "read-query",
			layer: "query",
			eyebrow: "1 · Interpret",
			title: "What does this SQL return?",
			description:
				"Read the SQL as written. Explain its result shape, filters, grouping, and ordering before discussing performance.",
			planNodeId: null,
			metric: null,
		},
	];

	if (baseline) {
		const node = baseline.plan.flat.find((entry) => entry.id === baselineNode);
		steps.push({
			id: "baseline-plan",
			layer: "plan",
			eyebrow: "2 · Observe",
			title: node?.label ?? "Inspect the original plan",
			description:
				node?.detail ?? "SQLite's original access path is highlighted.",
			planNodeId: baselineNode,
			metric: formatWork(baseline.benchmark),
		});
		steps.push({
			id: "baseline-rows",
			layer: "rows",
			eyebrow: "3 · Follow",
			title: "Follow real rows through this operator",
			description:
				"The values come from this SQLite fixture. Kept rows and output order are measured; motion explains the operator rather than claiming a hidden visit order.",
			planNodeId: baselineNode,
			metric:
				baseline.matchedRows === undefined
					? formatWork(baseline.benchmark)
					: `${baseline.matchedRows.toLocaleString()} ${
							problem.mode === "index"
								? problem.illustration.matchedLabel
								: "rows"
						}`,
		});
	}

	steps.push({
		id: "predict",
		layer: "change",
		eyebrow: "4 · Predict",
		title: "Commit to what should change",
		description: problem.predictHint,
		planNodeId: baselineNode,
		metric: "Pause for the learner",
	});

	if (changeApplied) {
		steps.push({
			id: "apply-change",
			layer: "change",
			eyebrow: "5 · Change",
			title: changeLabel(problem),
			description:
				problem.mode === "index"
					? "SQLite receives the learner's index, refreshes statistics, and replans the same query."
					: problem.technique === "ctas"
						? "SQLite builds the temporary summary and reads it twice. The build is inside the timer and work counters; answer equivalence is checked before speed."
						: "Both forms run against the same data and authored indexes; answer equivalence is checked before speed.",
			planNodeId: null,
			metric:
				problem.mode === "index"
					? "Schema → planner"
					: problem.technique === "ctas"
						? "Build + answer → work"
						: "Answer → work",
		});
	}

	if (candidate) {
		const candidateRows = candidate.matchedRows;
		const hasCandidateRows = candidateRows !== undefined;
		const node = candidate.plan.flat.find(
			(entry) => entry.id === candidateNode,
		);
		steps.push({
			id: "candidate-plan",
			layer: "plan",
			eyebrow: "6 · Replan",
			title: node?.label ?? "Inspect the new plan",
			description:
				diff?.headline ??
				node?.detail ??
				"The changed access path is highlighted.",
			planNodeId: candidateNode,
			metric: formatWork(candidate.benchmark),
		});

		if (hasCandidateRows) {
			steps.push({
				id: "candidate-rows",
				layer: "rows",
				eyebrow: "7 · Follow",
				title: "Watch the changed access path",
				description:
					"Replay the same real fixture values with the new plan so the changed work is visible, not just described.",
				planNodeId: candidateNode,
				metric: `${candidateRows.toLocaleString()} ${
					problem.mode === "index" ? problem.illustration.matchedLabel : "rows"
				}`,
			});
		}

		const before = baseline?.benchmark.work?.fullScanSteps;
		const after = candidate.benchmark.work?.fullScanSteps;
		steps.push({
			id: "compare-work",
			layer: "compare",
			eyebrow: `${hasCandidateRows ? 8 : 7} · Compare`,
			title: "Put the plans on the same scoreboard",
			description:
				"Correctness comes first. Then compare reproducible work counters; wall-clock time is supporting evidence because browsers are noisy.",
			planNodeId: candidateNode,
			metric:
				before !== undefined && after !== undefined
					? `${before.toLocaleString()} → ${after.toLocaleString()} full-scan steps`
					: `${baseline?.benchmark.medianMs ?? "—"} → ${candidate.benchmark.medianMs}ms`,
		});
		steps.push({
			id: "reflect",
			layer: "reflect",
			eyebrow: `${hasCandidateRows ? 9 : 8} · Explain`,
			title: "Explain why the work changed",
			description:
				"The learner should name the removed work and the plan evidence. A fast answer without an explanation is not yet durable understanding.",
			planNodeId: candidateNode,
			metric: "Say it in your own words",
		});
	}

	return steps;
}

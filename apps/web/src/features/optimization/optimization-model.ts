import { LAB_STAGES, type LabStage } from "@/components/optimize/stage-rail";
import type { OptimizationLabProblem } from "@/lib/curriculum/optimization-bank";
import type { OptimizationGuidanceMode } from "@/lib/optimize/lesson-session";
import type { OptimizationOutcome } from "@/lib/optimize/success";
import type { StageReport } from "@/lib/sql-engine/query-stages";
import type {
	BenchmarkResult,
	PlanDiff,
	QueryPlan,
	QuerySample,
	WalkResponse,
} from "@/lib/sql-engine/types";

export interface AppliedIndex {
	sql: string;
	label: string;
}

export interface Measurement {
	plan: QueryPlan;
	benchmark: BenchmarkResult;
	matchedRows?: number;
	stages?: StageReport | null;
	walk: WalkResponse | null;
	sample: QuerySample | null;
}

export interface VoicePrediction {
	question: string;
	response: string | null;
}

export interface QueryInterpretation {
	response: string;
	correct: boolean;
}

export interface IndexMeasurementSuccess {
	measurement: Measurement;
	diff: PlanDiff;
	outcome: OptimizationOutcome;
	summary: string;
}

export const OPTIMIZATION_SQL_SCOPE = "optimization-session";

export function indexLabel(sql: string): string {
	const match =
		/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w]+)/i.exec(
			sql,
		);
	return match?.[1] ?? sql.slice(0, 40);
}

export function isLabStage(value: string): value is LabStage {
	return LAB_STAGES.some((entry) => entry.id === value);
}

export function isGuidanceMode(
	value: string,
): value is Exclude<OptimizationGuidanceMode, "undecided"> {
	return value === "try-first" || value === "guided" || value === "show-me";
}

export function problemSql(problem: OptimizationLabProblem): string {
	return problem.mode === "index" ? problem.querySql : problem.baselineSql;
}

export function problemTechnique(problem: OptimizationLabProblem): string {
	if (problem.mode === "index") return "Index";
	return problem.technique === "ctas" ? "CTAS" : "Rewrite";
}

export function measurementSummary(
	measurement: Measurement,
	diff: PlanDiff | null,
): string {
	const nodes = measurement.plan.flat
		.map((node) => `#${node.id} ${node.label} (${node.detail})`)
		.join("; ");
	const work = measurement.benchmark.work;
	const counters = work
		? `${work.fullScanSteps.toLocaleString()} full-scan steps, ${work.sorts} sort operation(s), ${work.autoIndexRows.toLocaleString()} row(s) inserted into automatic indexes`
		: `${measurement.benchmark.medianMs}ms median`;
	return `Plan: ${nodes}. Measured work: ${counters}.${
		diff?.headline ? ` Change: ${diff.headline}.` : ""
	}`;
}

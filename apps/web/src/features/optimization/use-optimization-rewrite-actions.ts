import { useCallback } from "react";
import { toast } from "sonner";

import { optimizationDatasets } from "@/lib/curriculum/optimization-bank";
import { blockLab } from "@/lib/optimize/lab-controller";
import { evaluateRewriteAttempt } from "@/lib/optimize/success";
import { getSqlEngine } from "@/lib/sql-engine/client";
import { diffPlans } from "@/lib/sql-engine/explain";

import { type Measurement, OPTIMIZATION_SQL_SCOPE } from "./optimization-model";
import type { OptimizationSession } from "./optimization-session";
import type { OptimizationState } from "./use-optimization-state";

interface RewriteActionOptions {
	state: OptimizationState;
	session: OptimizationSession;
	revealComparison: (note: string | null) => void;
	logAttempt: (
		target: Extract<OptimizationState["problem"], { mode: "rewrite" }>,
		sql: string,
		result: ReturnType<typeof evaluateRewriteAttempt>,
	) => void;
	observe: (message: string) => void;
}

export function useOptimizationRewriteActions(options: RewriteActionOptions) {
	const { state, session, revealComparison, logAttempt, observe } = options;
	return useCallback(
		async (sql: string, rationale: string, learnerTurn: number) => {
			const target = state.problemRef.current;
			if (target.mode !== "rewrite") {
				return blockLab(
					"This is an index problem. Use the index tool instead.",
				);
			}
			const trimmed = sql.trim();
			if (!trimmed) return blockLab("The rewrite is empty.");
			const lesson = session.preview({ type: "apply-change", learnerTurn });
			if (!lesson.accepted) return blockLab(lesson.message);
			const revision = ++state.requestRevision.current;
			state.setBusy(true);
			try {
				const dataset = optimizationDatasets[target.datasetId];
				const response = await getSqlEngine().compare(
					dataset.ddl,
					target.baselineSql,
					trimmed,
					{
						indexes: target.indexes,
						samples: 3,
						supersedeKey: OPTIMIZATION_SQL_SCOPE,
					},
				);
				const baseline: Measurement = {
					plan: response.baselinePlan,
					benchmark: response.baseline,
					walk: null,
					sample: response.baselineSample,
				};
				const candidate: Measurement = {
					plan: response.candidatePlan,
					benchmark: response.candidate,
					walk: null,
					sample: response.candidateSample,
				};
				if (revision !== state.requestRevision.current) {
					return "A newer problem replaced this rewrite comparison.";
				}
				const outcome = evaluateRewriteAttempt(target, response);
				const diff = diffPlans(response.baselinePlan, response.candidatePlan);
				state.baselineRef.current = baseline;
				state.candidateRef.current = candidate;
				state.setBaseline(baseline);
				state.setCandidate(candidate);
				state.setComparison(response);
				state.setDiff(diff);
				state.setOutcome(outcome);
				state.setAlternativesVisible(false);
				session.commit(lesson.state);
				state.setRewriteSql(trimmed);
				state.setStage("compare");
				state.setTimelineCursor(4);
				revealComparison(diff.headline);
				logAttempt(target, trimmed, outcome);
				observe(
					`The learner compared this rewrite:\n${trimmed}\n${rationale ? `Their rationale: ${rationale}. ` : ""}Measurement finished. Result rows are visible; keep plan and performance conclusions hidden until the learner verifies correctness.`,
				);
				return "Measurement finished. The before/after result rows are visible. Ask whether the answers match, then stop and wait.";
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "The comparison failed.";
				if (revision === state.requestRevision.current) toast.error(message);
				return blockLab(`The rewrite could not be compared: ${message}`);
			} finally {
				if (revision === state.requestRevision.current) state.setBusy(false);
			}
		},
		[logAttempt, observe, revealComparison, session, state],
	);
}

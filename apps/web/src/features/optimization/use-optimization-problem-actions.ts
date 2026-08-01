import type { QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
	findOptimizationProblem,
	optimizationProblemBank,
} from "@/lib/curriculum/optimization-bank";
import { blockLab } from "@/lib/optimize/lab-controller";
import { getSqlEngine } from "@/lib/sql-engine/client";
import { client } from "@/utils/orpc";

import { OPTIMIZATION_SQL_SCOPE } from "./optimization-model";
import type { OptimizationSession } from "./optimization-session";
import type { OptimizationState } from "./use-optimization-state";

export function useOptimizationProblemActions(
	state: OptimizationState,
	session: OptimizationSession,
	queryClient: QueryClient,
	reducedMotion: boolean,
	revealSurface: (surface: "workspace") => void,
) {
	return useCallback(
		async (
			problemId: string,
			conversationId: string,
			explicitMoveOn: boolean,
			reason: string,
			learnerTurn: number,
		) => {
			const found = findOptimizationProblem(problemId);
			if (!found) {
				return blockLab(
					`Unknown problem "${problemId}". Available ids: ${optimizationProblemBank.map((entry) => entry.id).join(", ")}.`,
				);
			}
			const lesson = session.preview({
				type: "select-problem",
				problemId: found.id,
				explicitMoveOn,
				learnerTurn,
			});
			if (!lesson.accepted) return blockLab(lesson.message);

			let signalWarning = "";
			if (explicitMoveOn && conversationId) {
				try {
					await client.practice.recordSignal({
						conversationId,
						kind: "requested-to-move-on",
						concept: state.problemRef.current.concept,
						rationale: reason || null,
					});
					void queryClient.invalidateQueries();
				} catch {
					signalWarning =
						" The problem moved, but the spoken preference could not be saved; tell the learner.";
				}
			}

			state.requestRevision.current += 1;
			getSqlEngine().cancelScope(OPTIMIZATION_SQL_SCOPE);
			session.commit(lesson.state);
			state.problemRef.current = found;
			state.indexesRef.current = [];
			state.baselineRef.current = null;
			state.candidateRef.current = null;
			state.predictionRef.current = null;
			state.setProblem(found);
			state.setIndexes([]);
			state.setIndexSql("");
			state.setRewriteSql(found.mode === "rewrite" ? found.baselineSql : "");
			state.setInterpretation(null);
			state.setPrediction(null);
			state.setAlternativesVisible(false);
			state.setBaseline(null);
			state.setCandidate(null);
			state.setComparison(null);
			state.setDiff(null);
			state.setOutcome(null);
			state.setFocus(null);
			state.setStage("interpret");
			state.setStageNote(null);
			revealSurface("workspace");
			state.setTimelineCursor(0);
			state.setTimelinePlaying(false);
			state.setVisualPlayback(reducedMotion ? "complete" : "idle");
			state.attemptStartedAt.current = Date.now();
			return `Switched problems. The canvas now shows only the raw SQL. Ask the learner what it returns before naming the task, technique, or performance issue.${signalWarning}`;
		},
		[queryClient, reducedMotion, revealSurface, session, state],
	);
}

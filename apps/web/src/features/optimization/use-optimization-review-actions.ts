import type { QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { approachesForProblem } from "@/lib/optimize/approaches";
import { blockLab } from "@/lib/optimize/lab-controller";
import { client } from "@/utils/orpc";

import type { OptimizationSession } from "./optimization-session";
import type { OptimizationState } from "./use-optimization-state";

interface ReviewActionOptions {
	state: OptimizationState;
	session: OptimizationSession;
	queryClient: QueryClient;
	revealSurface: (
		surface: "workspace" | "prediction" | "comparison",
		note?: string | null,
	) => void;
	loadBaseline: (target: OptimizationState["problem"]) => Promise<string>;
	observe: (message: string) => void;
	timelineFind: (id: string) => number;
}

export function useOptimizationReviewActions(options: ReviewActionOptions) {
	const {
		state,
		session,
		queryClient,
		revealSurface,
		loadBaseline,
		observe,
		timelineFind,
	} = options;
	const reviewAlternatives = useCallback(() => {
		const lesson = session.dispatch({ type: "review-alternatives" });
		if (!lesson.accepted) return blockLab(lesson.message);
		const approaches = approachesForProblem(state.problemRef.current);
		const approach =
			approaches.find((entry) => entry.fit === "viable") ??
			approaches.find((entry) => entry.fit === "situational") ??
			approaches.find((entry) => entry.fit !== "best") ??
			approaches[0];
		state.setAlternativesVisible(true);
		state.setStage("compare");
		revealSurface(
			"comparison",
			"Compare the measured change with other approaches that actually fit this query.",
		);
		return approach
			? `${lesson.message} ${approach.technique} — ${approach.title}: ${approach.fit}. ${approach.effect} Trade-off: ${approach.tradeoff}`
			: blockLab("This problem has no authored alternative.");
	}, [revealSurface, session, state]);

	const resetIndexes = useCallback(async () => {
		state.indexesRef.current = [];
		state.candidateRef.current = null;
		state.setIndexes([]);
		state.setIndexSql("");
		state.setCandidate(null);
		state.setDiff(null);
		state.setOutcome(null);
		state.setAlternativesVisible(false);
		state.setStage("observe");
		state.setTimelineCursor(0);
		state.setTimelinePlaying(false);
		revealSurface("workspace");
		return await loadBaseline(state.problemRef.current);
	}, [loadBaseline, revealSurface, state]);

	const askPredict = useCallback(
		(question: string, learnerTurn: number) => {
			const lesson = session.dispatch({
				type: "ask-prediction",
				question,
				learnerTurn,
			});
			if (!lesson.accepted) return blockLab(lesson.message);
			const prediction = { question, response: null };
			state.predictionRef.current = prediction;
			state.setPrediction(prediction);
			state.setStage("predict");
			const index = timelineFind("predict");
			if (index >= 0) state.setTimelineCursor(index);
			revealSurface("prediction", "Commit before SQLite reveals the answer.");
			return `Prediction shown: "${question}". Pause for the learner's answer.`;
		},
		[revealSurface, session, state, timelineFind],
	);

	const recordExplanation = useCallback(
		async (
			conversationId: string,
			correct: boolean,
			rationale: string,
			learnerTurn: number,
		) => {
			if (!conversationId) return "No active conversation id is available.";
			const lesson = session.preview({
				type: "record-teachback",
				correct,
				learnerTurn,
			});
			if (!lesson.accepted) return blockLab(lesson.message);
			await client.practice.recordSignal({
				conversationId,
				kind: correct ? "explained-correctly" : "explained-incorrectly",
				concept: state.problemRef.current.concept,
				rationale: rationale || null,
			});
			session.commit(lesson.state);
			void queryClient.invalidateQueries();
			const message = correct
				? "Recorded a correct teach-back for this optimization concept."
				: "Recorded that the explanation still has a gap, so the concept should not advance yet.";
			observe(`${message} Evidence: ${rationale}`);
			return message;
		},
		[observe, queryClient, session, state],
	);

	return {
		reviewAlternatives,
		resetIndexes,
		askPredict,
		recordExplanation,
	};
}

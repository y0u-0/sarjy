import { useCallback } from "react";

import { blockLab } from "@/lib/optimize/lab-controller";

import { isGuidanceMode, measurementSummary } from "./optimization-model";
import type { OptimizationSession } from "./optimization-session";
import type { OptimizationState } from "./use-optimization-state";

export function useOptimizationCheckpoints(
	state: OptimizationState,
	session: OptimizationSession,
) {
	const recordInterpretation = useCallback(
		(response: string, correct: boolean, learnerTurn: number) => {
			const result = session.dispatch({
				type: "record-interpretation",
				response,
				correct,
				learnerTurn,
			});
			if (!result.accepted) return blockLab(result.message);
			if (!correct) return result.message;
			state.setInterpretation({ response: response.trim(), correct });
			return `${result.message} Keep the performance issue and solution hidden. Ask which teaching pace they want, then stop.`;
		},
		[session, state],
	);

	const chooseGuidance = useCallback(
		(mode: string, reason: string, learnerTurn: number) => {
			if (!isGuidanceMode(mode)) {
				return blockLab("Use try-first, guided, or show-me.");
			}
			const result = session.dispatch({
				type: "choose-guidance",
				mode,
				learnerTurn,
			});
			if (!result.accepted) return blockLab(result.message);
			state.setStage("observe");
			return `${result.message}${reason ? ` Learner's reason: ${reason}` : ""}`;
		},
		[session, state],
	);

	const recordObservation = useCallback(
		(response: string, correct: boolean, learnerTurn: number) => {
			const result = session.dispatch({
				type: "record-observation",
				response,
				correct,
				learnerTurn,
			});
			if (result.accepted) state.setAlternativesVisible(false);
			return result.accepted ? result.message : blockLab(result.message);
		},
		[session, state],
	);

	const recordPrediction = useCallback(
		(response: string, learnerTurn: number) => {
			const result = session.dispatch({
				type: "record-prediction",
				response,
				learnerTurn,
			});
			if (!result.accepted) return blockLab(result.message);
			const trimmed = response.trim();
			state.setPrediction((current) =>
				current ? { ...current, response: trimmed } : current,
			);
			state.predictionRef.current = state.predictionRef.current
				? { ...state.predictionRef.current, response: trimmed }
				: null;
			return result.message;
		},
		[session, state],
	);

	const recordDataObservation = useCallback(
		(response: string, correct: boolean, learnerTurn: number) => {
			const result = session.dispatch({
				type: "record-data-observation",
				response,
				correct,
				learnerTurn,
			});
			return result.accepted ? result.message : blockLab(result.message);
		},
		[session],
	);

	const recordComparison = useCallback(
		(response: string, correct: boolean, learnerTurn: number) => {
			const result = session.dispatch({
				type: "record-comparison",
				response,
				correct,
				learnerTurn,
			});
			return result.accepted ? result.message : blockLab(result.message);
		},
		[session],
	);

	const recordCorrectness = useCallback(
		(response: string, correct: boolean, learnerTurn: number) => {
			const result = session.dispatch({
				type: "record-correctness",
				response,
				correct,
				learnerTurn,
			});
			if (!result.accepted) return blockLab(result.message);
			if (!correct) return result.message;
			const candidate = state.candidateRef.current;
			return candidate
				? `${result.message} ${measurementSummary(candidate, state.diff)}`
				: result.message;
		},
		[session, state],
	);

	const recordAlternativeReview = useCallback(
		(response: string, correct: boolean, learnerTurn: number) => {
			const result = session.dispatch({
				type: "record-alternative-review",
				response,
				correct,
				learnerTurn,
			});
			return result.accepted ? result.message : blockLab(result.message);
		},
		[session],
	);

	return {
		recordInterpretation,
		chooseGuidance,
		recordObservation,
		recordDataObservation,
		recordPrediction,
		recordCorrectness,
		recordComparison,
		recordAlternativeReview,
	};
}

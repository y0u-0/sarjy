import {
	type OptimizationLessonAction,
	type OptimizationLessonState,
	type OptimizationLessonTransition,
	rejectLesson,
	requireFreshLearnerResponse,
} from "./lesson-session-model";

export function transitionLessonCompletion(
	state: OptimizationLessonState,
	action: OptimizationLessonAction,
): OptimizationLessonTransition {
	if (action.type === "ask-prediction") {
		if (
			!state.observationRecorded ||
			(state.guidance !== "try-first" && !state.dataObservationRecorded)
		) {
			return rejectLesson(
				state,
				"Ask one observation question and record the learner's answer before prediction.",
			);
		}
		if (!action.question.trim()) {
			return rejectLesson(state, "The prediction question cannot be empty.");
		}
		return {
			accepted: true,
			state: {
				...state,
				predictionAsked: true,
				checkpoint: "predict",
				awaitingResponse: "prediction",
				responseRequestedAtTurn: action.learnerTurn,
			},
			message: "Prediction question is ready. Wait for the learner's answer.",
		};
	}

	if (action.type === "record-prediction") {
		const blocked = requireFreshLearnerResponse(
			state,
			"prediction",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (!state.predictionAsked) {
			return rejectLesson(
				state,
				"Ask the on-screen prediction before recording an answer.",
			);
		}
		if (!action.response.trim()) {
			return rejectLesson(
				state,
				"Record the learner's actual prediction, not silence.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				predictionRecorded: true,
				checkpoint: "change",
				awaitingResponse: "change",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message:
				"Prediction recorded and the editor is unlocked. STOP HERE. Ask the learner to write one change and submit it for measurement, then wait for that new learner action.",
		};
	}

	if (action.type === "apply-change") {
		const blocked = requireFreshLearnerResponse(
			state,
			"change",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (state.changeApplied) {
			return rejectLesson(
				state,
				state.teachback === "correct"
					? "Before another measured change, ask a fresh observation question and record the learner's answer."
					: "Finish the current comparison and teach-back before another measured change.",
			);
		}
		if (!state.predictionRecorded) {
			return rejectLesson(
				state,
				"Do not apply the answer yet. Ask for and record the learner's prediction first.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				changeApplied: true,
				correctnessRecorded: false,
				correctnessConfirmed: null,
				comparisonRecorded: false,
				comparisonCorrect: null,
				alternativesRevealed: false,
				alternativesReviewed: false,
				checkpoint: "compare",
				awaitingResponse: "correctness",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message:
				"Change is measured. Reveal only the before/after result rows, ask whether the answers still match, then wait.",
		};
	}

	if (action.type === "record-correctness") {
		const blocked = requireFreshLearnerResponse(
			state,
			"correctness",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (!action.response.trim()) {
			return rejectLesson(
				state,
				"Record the learner's actual result comparison, not silence.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				correctnessRecorded: action.correct,
				correctnessConfirmed: action.correct,
				checkpoint: "compare",
				awaitingResponse: action.correct ? "comparison" : "correctness",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message: action.correct
				? "Result correctness aligned. Reveal one changed plan operator or work metric, ask what changed, then wait."
				: "Correctness gap recorded. Keep the result rows visible, give one small hint, and wait for a new answer.",
		};
	}

	if (action.type === "record-comparison") {
		const blocked = requireFreshLearnerResponse(
			state,
			"comparison",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (!action.response.trim()) {
			return rejectLesson(
				state,
				"Record the learner's actual comparison, not silence.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				comparisonRecorded: action.correct,
				comparisonCorrect: action.correct,
				checkpoint: action.correct ? "alternatives" : "compare",
				awaitingResponse: action.correct ? null : "comparison",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message: action.correct
				? "Comparison aligned. One relevant alternative may now be revealed."
				: "Comparison gap recorded. Keep the same evidence visible, give one small hint, and wait for a new answer.",
		};
	}

	if (action.type === "review-alternatives") {
		if (!state.changeApplied || !state.comparisonRecorded) {
			return rejectLesson(
				state,
				"Align on the measured before/after evidence before revealing an alternative.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				alternativesRevealed: true,
				alternativesReviewed: false,
				checkpoint: "alternatives",
				awaitingResponse: "alternative-review",
				responseRequestedAtTurn: state.lastLearnerTurn,
			},
			message:
				"One relevant alternative is visible. Ask why it fits or does not fit, then wait for the learner's answer.",
		};
	}

	if (action.type === "record-alternative-review") {
		const blocked = requireFreshLearnerResponse(
			state,
			"alternative-review",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (!action.response.trim()) {
			return rejectLesson(
				state,
				"Record the learner's actual alternative comparison, not silence.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				alternativesReviewed: action.correct,
				checkpoint: action.correct ? "teachback" : "alternatives",
				awaitingResponse: action.correct ? "teachback" : "alternative-review",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message: action.correct
				? "Alternative trade-off understood. Ask for one final teach-back, then wait."
				: "Alternative gap recorded. Keep it visible, give one small hint, and wait for a new answer.",
		};
	}

	if (action.type !== "record-teachback") {
		return rejectLesson(state, "This lesson action is unavailable here.");
	}
	if (!state.changeApplied) {
		return rejectLesson(
			state,
			"Measure a change before assessing a teach-back.",
		);
	}
	if (!state.alternativesReviewed) {
		return rejectLesson(
			state,
			"Review the problem-specific alternative approaches before assessing teach-back.",
		);
	}
	const blocked = requireFreshLearnerResponse(
		state,
		"teachback",
		action.learnerTurn,
	);
	if (blocked) return blocked;
	return {
		accepted: true,
		state: {
			...state,
			teachback: action.correct ? "correct" : "incorrect",
			checkpoint: action.correct ? "complete" : "teachback",
			awaitingResponse: action.correct ? null : "teachback",
			responseRequestedAtTurn: action.learnerTurn,
			lastLearnerTurn: action.learnerTurn,
		},
		message: action.correct
			? "Correct teach-back recorded. The lesson is complete."
			: "Explanation gap recorded. Consolidate it and ask for another teach-back.",
	};
}

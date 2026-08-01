import {
	createOptimizationLesson,
	type OptimizationLessonAction,
	type OptimizationLessonState,
	type OptimizationLessonTransition,
	rejectLesson,
	requireFreshLearnerResponse,
} from "./lesson-session-model";

export function transitionLessonFoundation(
	state: OptimizationLessonState,
	action: OptimizationLessonAction,
): OptimizationLessonTransition | null {
	if (action.type === "record-interpretation") {
		const blocked = requireFreshLearnerResponse(
			state,
			"interpretation",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (!action.response.trim()) {
			return rejectLesson(
				state,
				"Record the learner's actual interpretation, not silence.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				interpretationRecorded: true,
				interpretationCorrect: action.correct,
				checkpoint: action.correct ? "orientation" : "interpret",
				awaitingResponse: action.correct ? "guidance" : "interpretation",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message: action.correct
				? "Interpretation recorded as correct. Reveal the task in one sentence, then ask for a guidance mode."
				: "Interpretation gap recorded. Give one small hint, then wait for a new learner answer before trying again.",
		};
	}
	if (action.type === "choose-guidance") {
		if (!state.interpretationRecorded || !state.interpretationCorrect) {
			return rejectLesson(
				state,
				"Start with the raw SQL and wait until the learner interprets what it returns.",
			);
		}
		const blocked = requireFreshLearnerResponse(
			state,
			"guidance",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		return {
			accepted: true,
			state: {
				...state,
				guidance: action.mode,
				checkpoint: "observe",
				awaitingResponse: "observation",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message: `Guidance mode is now ${action.mode}. Show at most one piece of evidence, ask one observation question, then wait.`,
		};
	}
	if (action.type === "select-problem") {
		const untouched =
			state.guidance === "undecided" &&
			!state.interpretationRecorded &&
			!state.planRevealed &&
			!state.observationRecorded &&
			!state.predictionAsked &&
			!state.changeApplied;
		if (
			!untouched &&
			state.checkpoint !== "complete" &&
			!action.explicitMoveOn
		) {
			return rejectLesson(
				state,
				"Finish the teach-back before moving on, unless the learner explicitly asks to skip or change problems.",
			);
		}
		return {
			accepted: true,
			state: createOptimizationLesson(
				action.problemId,
				action.learnerTurn ?? 0,
			),
			message: action.explicitMoveOn
				? "The learner explicitly asked to move on; switch problems and record that request."
				: "The next optimization problem may be loaded.",
		};
	}

	if (action.type === "reveal-plan" && state.checkpoint !== "observe") {
		return rejectLesson(
			state,
			"Plan evidence belongs only to the observation checkpoint. Stay on the current learner step.",
		);
	}
	if (action.type === "reveal-plan" && state.guidance === "undecided") {
		return rejectLesson(
			state,
			"Talk first: ask the learner whether they want to try first, be guided, or see a walkthrough, then record that choice.",
		);
	}
	if (action.type === "reveal-plan" && state.guidance === "try-first") {
		return rejectLesson(
			state,
			"The learner chose try-first. Keep the plan hidden until they ask for guidance or a walkthrough, then update the guidance mode.",
		);
	}
	if (action.type === "reveal-plan") {
		return {
			accepted: true,
			state: { ...state, planRevealed: true, checkpoint: "observe" },
			message: "Plan evidence may be revealed.",
		};
	}

	if (action.type === "record-observation") {
		const blocked = requireFreshLearnerResponse(
			state,
			"observation",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (state.guidance === "undecided") {
			return rejectLesson(
				state,
				"Choose a guidance mode before recording observation.",
			);
		}
		if (state.guidance !== "try-first" && !state.planRevealed) {
			return rejectLesson(
				state,
				"Reveal and discuss one measured operator before recording the learner's observation.",
			);
		}
		if (!action.response.trim()) {
			return rejectLesson(
				state,
				"Record the learner's actual observation, not silence.",
			);
		}
		if (!action.correct) {
			return {
				accepted: true,
				state: {
					...state,
					observationCorrect: false,
					checkpoint: "observe",
					responseRequestedAtTurn: action.learnerTurn,
					lastLearnerTurn: action.learnerTurn,
				},
				message:
					"Observation gap recorded. Keep the same evidence visible, give one small hint, and wait for a new answer.",
			};
		}
		const beginsAnotherChange = state.checkpoint === "complete";
		return {
			accepted: true,
			state: {
				...state,
				observationRecorded: true,
				observationCorrect: true,
				predictionAsked: beginsAnotherChange ? false : state.predictionAsked,
				predictionRecorded: beginsAnotherChange
					? false
					: state.predictionRecorded,
				changeApplied: beginsAnotherChange ? false : state.changeApplied,
				alternativesReviewed: beginsAnotherChange
					? false
					: state.alternativesReviewed,
				teachback: beginsAnotherChange ? "none" : state.teachback,
				checkpoint: state.guidance === "try-first" ? "predict" : "observe",
				awaitingResponse: null,
				lastLearnerTurn: action.learnerTurn,
			},
			message:
				state.guidance === "try-first"
					? "Observation recorded. The prediction beat is now available."
					: "Plan observation recorded. Reveal the real-data animation next, ask what the operator does to those rows, then wait.",
		};
	}

	if (action.type === "reveal-data") {
		if (
			state.checkpoint !== "observe" ||
			!state.planRevealed ||
			!state.observationRecorded
		) {
			return rejectLesson(
				state,
				"Align on the visible plan operator before revealing its real-data animation.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				dataRevealed: true,
				awaitingResponse: "data-observation",
				responseRequestedAtTurn: state.lastLearnerTurn,
			},
			message:
				"The real-data animation may be shown. Ask what happens to the rows, then wait.",
		};
	}

	if (action.type === "record-data-observation") {
		const blocked = requireFreshLearnerResponse(
			state,
			"data-observation",
			action.learnerTurn,
		);
		if (blocked) return blocked;
		if (!action.response.trim()) {
			return rejectLesson(
				state,
				"Record the learner's actual row-flow observation, not silence.",
			);
		}
		return {
			accepted: true,
			state: {
				...state,
				dataObservationRecorded: action.correct,
				dataObservationCorrect: action.correct,
				checkpoint: action.correct ? "predict" : "observe",
				awaitingResponse: action.correct ? null : "data-observation",
				responseRequestedAtTurn: action.learnerTurn,
				lastLearnerTurn: action.learnerTurn,
			},
			message: action.correct
				? "Row-flow observation aligned. The prediction beat is now available."
				: "Row-flow gap recorded. Replay the same animation, give one small hint, and wait for a new answer.",
		};
	}
	return null;
}

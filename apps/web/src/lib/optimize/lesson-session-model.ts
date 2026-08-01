export type OptimizationGuidanceMode =
	| "undecided"
	| "try-first"
	| "guided"
	| "show-me";

export type OptimizationResponseGate =
	| "interpretation"
	| "guidance"
	| "observation"
	| "data-observation"
	| "prediction"
	| "change"
	| "correctness"
	| "comparison"
	| "alternative-review"
	| "teachback";

export interface OptimizationLessonState {
	problemId: string;
	guidance: OptimizationGuidanceMode;
	checkpoint:
		| "interpret"
		| "orientation"
		| "observe"
		| "predict"
		| "change"
		| "compare"
		| "alternatives"
		| "teachback"
		| "complete";
	awaitingResponse: OptimizationResponseGate | null;
	responseRequestedAtTurn: number;
	lastLearnerTurn: number;
	interpretationRecorded: boolean;
	interpretationCorrect: boolean | null;
	planRevealed: boolean;
	observationRecorded: boolean;
	observationCorrect: boolean | null;
	dataRevealed: boolean;
	dataObservationRecorded: boolean;
	dataObservationCorrect: boolean | null;
	predictionAsked: boolean;
	predictionRecorded: boolean;
	changeApplied: boolean;
	correctnessRecorded: boolean;
	correctnessConfirmed: boolean | null;
	comparisonRecorded: boolean;
	comparisonCorrect: boolean | null;
	alternativesRevealed: boolean;
	alternativesReviewed: boolean;
	teachback: "none" | "incorrect" | "correct";
}

export type OptimizationLessonAction =
	| {
			type: "record-interpretation";
			response: string;
			correct: boolean;
			learnerTurn: number;
	  }
	| {
			type: "choose-guidance";
			mode: Exclude<OptimizationGuidanceMode, "undecided">;
			learnerTurn: number;
	  }
	| { type: "reveal-plan" }
	| {
			type: "record-observation";
			response: string;
			correct: boolean;
			learnerTurn: number;
	  }
	| { type: "reveal-data" }
	| {
			type: "record-data-observation";
			response: string;
			correct: boolean;
			learnerTurn: number;
	  }
	| { type: "ask-prediction"; question: string; learnerTurn: number }
	| { type: "record-prediction"; response: string; learnerTurn: number }
	| { type: "apply-change"; learnerTurn: number }
	| {
			type: "record-correctness";
			response: string;
			correct: boolean;
			learnerTurn: number;
	  }
	| { type: "review-alternatives" }
	| {
			type: "record-comparison";
			response: string;
			correct: boolean;
			learnerTurn: number;
	  }
	| {
			type: "record-alternative-review";
			response: string;
			correct: boolean;
			learnerTurn: number;
	  }
	| { type: "record-teachback"; correct: boolean; learnerTurn: number }
	| {
			type: "select-problem";
			problemId: string;
			explicitMoveOn: boolean;
			learnerTurn?: number;
	  };

export interface OptimizationLessonTransition {
	accepted: boolean;
	state: OptimizationLessonState;
	message: string;
}

export function createOptimizationLesson(
	problemId: string,
	responseRequestedAtTurn = 0,
): OptimizationLessonState {
	return {
		problemId,
		guidance: "undecided",
		checkpoint: "interpret",
		awaitingResponse: "interpretation",
		responseRequestedAtTurn,
		lastLearnerTurn: responseRequestedAtTurn,
		interpretationRecorded: false,
		interpretationCorrect: null,
		planRevealed: false,
		observationRecorded: false,
		observationCorrect: null,
		dataRevealed: false,
		dataObservationRecorded: false,
		dataObservationCorrect: null,
		predictionAsked: false,
		predictionRecorded: false,
		changeApplied: false,
		correctnessRecorded: false,
		correctnessConfirmed: null,
		comparisonRecorded: false,
		comparisonCorrect: null,
		alternativesRevealed: false,
		alternativesReviewed: false,
		teachback: "none",
	};
}

export function requireFreshLearnerResponse(
	state: OptimizationLessonState,
	gate: OptimizationResponseGate,
	learnerTurn: number,
): OptimizationLessonTransition | null {
	if (state.awaitingResponse !== gate) {
		return rejectLesson(
			state,
			`The lesson is waiting for ${state.awaitingResponse ?? "the teacher's next prompt"}, not ${gate}.`,
		);
	}
	if (learnerTurn <= state.responseRequestedAtTurn) {
		return rejectLesson(
			state,
			"Pause and wait for a new learner answer before recording this step.",
		);
	}
	return null;
}

export function rejectLesson(
	state: OptimizationLessonState,
	message: string,
): OptimizationLessonTransition {
	return { accepted: false, state, message };
}

export type WeatherEvidenceSurface = "data" | "chart" | "result" | "plan";

export interface WeatherLessonState {
	missionId: string | null;
	checkpoint:
		| "city-choice"
		| "predict"
		| "query"
		| "review"
		| "teachback"
		| "complete";
	prediction: string | null;
	queryChecked: boolean;
	queryPassed: boolean;
	chartRevealed: boolean;
	explanation: "none" | "incorrect" | "correct";
}

export type WeatherLessonAction =
	| { type: "mission-created"; missionId: string }
	| { type: "record-prediction"; response: string }
	| { type: "query-checked"; passed: boolean }
	| { type: "reveal-evidence"; surface: WeatherEvidenceSurface }
	| { type: "record-explanation"; correct: boolean };

export interface WeatherLessonTransition {
	accepted: boolean;
	state: WeatherLessonState;
	message: string;
}

export function createWeatherLesson(): WeatherLessonState {
	return {
		missionId: null,
		checkpoint: "city-choice",
		prediction: null,
		queryChecked: false,
		queryPassed: false,
		chartRevealed: false,
		explanation: "none",
	};
}

function reject(
	state: WeatherLessonState,
	message: string,
): WeatherLessonTransition {
	return { accepted: false, state, message };
}

export function transitionWeatherLesson(
	state: WeatherLessonState,
	action: WeatherLessonAction,
): WeatherLessonTransition {
	if (action.type === "mission-created") {
		if (!action.missionId.trim()) {
			return reject(state, "The live-data snapshot needs an id.");
		}
		return {
			accepted: true,
			state: {
				...createWeatherLesson(),
				missionId: action.missionId,
				checkpoint: "predict",
			},
			message: "Mission loaded. Ask for a prediction before revealing data.",
		};
	}

	if (!state.missionId) {
		return reject(state, "Create a live-data mission before teaching it.");
	}

	if (action.type === "record-prediction") {
		const response = action.response.trim();
		if (!response) {
			return reject(
				state,
				"Record the learner's actual prediction, not silence.",
			);
		}
		return {
			accepted: true,
			state: { ...state, prediction: response, checkpoint: "query" },
			message: "Prediction recorded. The SQL workspace is now available.",
		};
	}

	if (!state.prediction) {
		return reject(
			state,
			"Wait for and record the learner's prediction before revealing data or checking SQL.",
		);
	}

	if (action.type === "query-checked") {
		return {
			accepted: true,
			state: {
				...state,
				queryChecked: true,
				queryPassed: action.passed,
				chartRevealed: action.passed ? state.chartRevealed : false,
				checkpoint: action.passed ? "review" : "query",
			},
			message: action.passed
				? "The SQL answer is correct. Reveal the chart and connect it to the result."
				: "The SQL answer still differs. Coach a correction without completing the mission.",
		};
	}

	if (action.type === "reveal-evidence") {
		if (
			(action.surface === "chart" ||
				action.surface === "result" ||
				action.surface === "plan") &&
			!state.queryChecked
		) {
			return reject(
				state,
				"Reveal that evidence only after the learner has a checked query.",
			);
		}
		const chartRevealed = state.chartRevealed || action.surface === "chart";
		return {
			accepted: true,
			state: {
				...state,
				chartRevealed,
				checkpoint:
					state.queryPassed && chartRevealed ? "teachback" : state.checkpoint,
			},
			message: `The ${action.surface} evidence may be shown.`,
		};
	}

	if (!state.queryPassed) {
		return reject(state, "A correct SQL answer is required before teach-back.");
	}
	if (!state.chartRevealed) {
		return reject(
			state,
			"Connect the correct result to the chart before assessing teach-back.",
		);
	}
	return {
		accepted: true,
		state: {
			...state,
			explanation: action.correct ? "correct" : "incorrect",
			checkpoint: action.correct ? "complete" : "teachback",
		},
		message: action.correct
			? "Correct teach-back recorded. The live-data mission is complete."
			: "The explanation still has a gap. Consolidate it and ask again.",
	};
}

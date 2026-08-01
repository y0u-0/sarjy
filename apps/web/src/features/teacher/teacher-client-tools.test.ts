import { expect, test } from "bun:test";

import { getExercise } from "@/lib/curriculum";
import { PROFILE_NOT_OPEN } from "@/lib/profile/profile-controller";

import {
	createTeacherClientTools,
	type TeacherClientApi,
} from "./teacher-client-tools";
import { createTeacherRuntime } from "./teacher-runtime";

const api: TeacherClientApi = {
	practice: {
		recordSignal: async () => undefined,
		recordTeacherEvent: async () => undefined,
	},
	learner: {
		remember: async () => undefined,
		recall: async () => "No memories found.",
	},
};

test("preserves the complete agent tool contract", () => {
	const runtime = createTeacherRuntime();
	const tools = createTeacherClientTools(runtime, api);

	expect(Object.keys(tools)).toEqual([
		"weather_create_mission",
		"weather_record_prediction",
		"weather_surface",
		"weather_check_query",
		"weather_record_explanation",
		"assessment_finish_interview",
		"question_move_next",
		"profile_control",
		"record_spoken_hint",
		"show_hint",
		"remember",
		"recall",
		"record_explanation",
		"record_learning_signal",
		"lab_select_problem",
		"lab_record_interpretation",
		"lab_set_guidance",
		"lab_record_observation",
		"lab_record_prediction",
		"lab_record_data_observation",
		"lab_record_comparison",
		"lab_record_correctness",
		"lab_record_alternative_review",
		"lab_canvas",
		"lab_explain",
		"lab_apply_index",
		"lab_apply_rewrite",
		"lab_review_alternatives",
		"lab_reset_indexes",
		"lab_ask_predict",
		"lab_timeline",
		"lab_record_explanation",
		"row_walk",
	]);
});

test("tracks fresh learner turns independently of agent speech", () => {
	const runtime = createTeacherRuntime();
	expect(runtime.getLearnerTurn()).toBe(0);
	runtime.appendTranscript("agent", "What does this query return?");
	expect(runtime.getLearnerTurn()).toBe(0);
	runtime.appendTranscript("user", "It returns one count.");
	expect(runtime.getLearnerTurn()).toBe(1);
});

test("keeps editor help locked until a voice hint and another learner turn", () => {
	const runtime = createTeacherRuntime();
	const tools = createTeacherClientTools(runtime, api);
	const entry = getExercise("select-everything");
	if (!entry) throw new Error("Exercise fixture is missing.");
	runtime.actions.setCurrentExercise(entry);
	runtime.appendTranscript("user", "Can you help me?");

	const editorHint = {
		exercise_id: entry.exercise.id,
		level: "hint",
		title: "Keep your SELECT",
		body: "Fill the missing table name.",
		sql: "SELECT * FROM ?;",
	};
	expect(tools.show_hint(editorHint)).toContain("voice hint first");
	expect(
		tools.record_spoken_hint({ exercise_id: entry.exercise.id }),
	).toContain("Voice hint recorded");
	expect(tools.show_hint(editorHint)).toContain("try or respond");

	runtime.appendTranscript("agent", "Which table contains the artists?");
	runtime.appendTranscript("user", "I am still stuck.");
	expect(
		tools.show_hint({
			...editorHint,
			sql: "SELECT * FROM artists;",
		}),
	).toContain("? blank");
	expect(runtime.store.getState().hint).toBeNull();
	expect(tools.show_hint(editorHint)).toBe("displayed");
	expect(runtime.store.getState().hint?.sql).toBe("SELECT * FROM ?;");
});

test("finishes placement only through the active starting-point screen", async () => {
	const runtime = createTeacherRuntime();
	const tools = createTeacherClientTools(runtime, api);

	expect(
		await tools.assessment_finish_interview({
			level: "intermediate",
			rationale: "Uses joins, but has not worked with window functions.",
		}),
	).toContain("not open");

	runtime.controllers.setStartingPoint({
		complete: async (level, rationale) => `${level}: ${rationale}`,
	});
	expect(
		await tools.assessment_finish_interview({
			level: "intermediate",
			rationale: "Uses joins.",
		}),
	).toBe("intermediate: Uses joins.");
});

test("maps profile tools through the active controller and rejects stale screens", () => {
	const runtime = createTeacherRuntime();
	const tools = createTeacherClientTools(runtime, api);

	expect(tools.profile_control({ action: "describe" })).toBe(PROFILE_NOT_OPEN);

	runtime.controllers.setProfile({
		describe: () => "current profile",
		setView: (view) => `view:${view}`,
		compareSession: (sessionId) => `session:${sessionId}`,
		focusTopic: (concept, note) => `focus:${concept}:${note}`,
	});

	expect(
		tools.profile_control({ action: "set-view", view: "optimization" }),
	).toBe("view:optimization");
	expect(
		tools.profile_control({
			action: "focus-topic",
			concept: "joins",
			note: "review fan-out",
		}),
	).toBe("focus:joins:review fan-out");

	runtime.controllers.setProfile(null);
	expect(tools.profile_control({ action: "describe" })).toBe(PROFILE_NOT_OPEN);
});

test("shows a full solution only after the learner explicitly asks for it", async () => {
	const runtime = createTeacherRuntime();
	const tools = createTeacherClientTools(runtime, api);
	const entry = getExercise("select-everything");
	if (!entry) throw new Error("Exercise fixture is missing.");
	runtime.actions.setCurrentExercise(entry);
	runtime.setConversationId("conversation-1");

	expect(
		tools.show_hint({
			exercise_id: entry.exercise.id,
			level: "solution",
			title: "Complete answer",
			body: "The finished query.",
			sql: "SELECT * FROM artists;",
		}),
	).toContain("explicitly ask");
	expect(runtime.store.getState().hint).toBeNull();

	expect(
		await tools.record_learning_signal({
			exercise_id: entry.exercise.id,
			kind: "asked-for-answer",
			rationale: "The learner said: give me the complete answer.",
		}),
	).toContain("Recorded");

	expect(
		tools.show_hint({
			exercise_id: entry.exercise.id,
			level: "solution",
			title: "Complete answer",
			body: "The finished query.",
			sql: "  SELECT * FROM artists;  ",
		}),
	).toBe("displayed");
	expect(runtime.store.getState().hint).toMatchObject({
		level: "solution",
		title: "Complete answer",
		body: "The finished query.",
		sql: "SELECT * FROM artists;",
	});
});

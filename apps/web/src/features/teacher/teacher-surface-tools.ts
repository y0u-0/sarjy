import { QUESTION_NOT_OPEN } from "@/lib/practice/question-controller";
import { STARTING_POINT_NOT_OPEN } from "@/lib/practice/starting-point-controller";
import { PROFILE_NOT_OPEN } from "@/lib/profile/profile-controller";
import { controlProfile } from "@/lib/teacher/teacher-surface-control";

import type { TeacherRuntime } from "./teacher-runtime";
import type { HintLevel } from "./teacher-types";

function parseHintLevel(value: unknown): HintLevel {
	return value === "solution" || value === "hint" ? value : "nudge";
}

export function createTeacherSurfaceTools(runtime: TeacherRuntime) {
	const { controllers } = runtime;
	return {
		assessment_finish_interview: async (params: Record<string, unknown>) =>
			(await controllers
				.getStartingPoint()
				?.complete(
					String(params.level ?? ""),
					String(params.rationale ?? ""),
				)) ?? STARTING_POINT_NOT_OPEN,
		question_move_next: async (params: Record<string, unknown>) =>
			(await controllers
				.getQuestion()
				?.moveNext(
					String(params.exercise_id ?? ""),
					String(params.reason ?? ""),
				)) ?? QUESTION_NOT_OPEN,
		profile_control: (params: Record<string, unknown>) => {
			const profile = controllers.getProfile();
			return profile ? controlProfile(profile, params) : PROFILE_NOT_OPEN;
		},
		record_spoken_hint: (params: Record<string, unknown>) =>
			runtime.recordHintEvent("spoken-hint", String(params.exercise_id ?? "")),
		show_hint: (params: Record<string, unknown>) => {
			const level = parseHintLevel(params.level);
			const exerciseId = String(params.exercise_id ?? "");
			const sql =
				typeof params.sql === "string" && params.sql.trim()
					? params.sql.trim()
					: undefined;
			return runtime.showHint({
				exerciseId,
				level,
				title: String(params.title ?? "Hint"),
				body: String(params.body ?? ""),
				sql,
			});
		},
	};
}

import { LAB_NOT_OPEN } from "@/lib/optimize/lab-controller";
import { controlLabCanvas } from "@/lib/teacher/teacher-surface-control";

import { auditLabTool } from "./teacher-audit";
import type { TeacherClientApi } from "./teacher-client-api";
import type { TeacherRuntime } from "./teacher-runtime";

export function createTeacherLabFoundationTools(
	runtime: TeacherRuntime,
	api: TeacherClientApi,
) {
	const { controllers } = runtime;
	return {
		lab_select_problem: (params: Record<string, unknown>) => {
			const problemId = String(params.problem_id ?? "");
			const explicitMoveOn = params.student_requested_move_on === true;
			return auditLabTool(
				runtime,
				api,
				explicitMoveOn ? "problem-skipped" : "problem-selected",
				() =>
					controllers
						.getLab()
						?.selectProblem(
							problemId,
							runtime.getConversationId() ?? "",
							explicitMoveOn,
							String(params.reason ?? ""),
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
				problemId,
			);
		},
		lab_record_interpretation: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"interpretation-recorded",
				() =>
					controllers
						.getLab()
						?.recordInterpretation(
							String(params.response ?? ""),
							params.correct === true,
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_set_guidance: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"guidance-selected",
				() =>
					controllers
						.getLab()
						?.chooseGuidance(
							String(params.mode ?? ""),
							String(params.reason ?? ""),
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_record_observation: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"observation-recorded",
				() =>
					controllers
						.getLab()
						?.recordObservation(
							String(params.response ?? ""),
							params.correct === true,
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_record_prediction: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"prediction-recorded",
				() =>
					controllers
						.getLab()
						?.recordPrediction(
							String(params.response ?? ""),
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_record_data_observation: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"data-observation-recorded",
				() =>
					controllers
						.getLab()
						?.recordDataObservation(
							String(params.response ?? ""),
							params.correct === true,
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_record_comparison: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"comparison-recorded",
				() =>
					controllers
						.getLab()
						?.recordComparison(
							String(params.response ?? ""),
							params.correct === true,
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_record_correctness: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"correctness-recorded",
				() =>
					controllers
						.getLab()
						?.recordCorrectness(
							String(params.response ?? ""),
							params.correct === true,
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_record_alternative_review: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"alternatives-reviewed",
				() =>
					controllers
						.getLab()
						?.recordAlternativeReview(
							String(params.response ?? ""),
							params.correct === true,
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_canvas: (params: Record<string, unknown>) => {
			const action = String(params.action ?? "");
			const surface = String(params.surface ?? "");
			const invoke = () => {
				const lab = controllers.getLab();
				return lab ? controlLabCanvas(lab, params) : LAB_NOT_OPEN;
			};
			const revealsPlan =
				action === "focus-plan" ||
				action === "replay-animation" ||
				(action === "show" && (surface === "plan" || surface === "animation"));
			return revealsPlan
				? auditLabTool(runtime, api, "plan-revealed", invoke)
				: invoke();
		},
	};
}

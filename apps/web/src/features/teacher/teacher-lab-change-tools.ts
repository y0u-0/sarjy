import { LAB_NOT_OPEN } from "@/lib/optimize/lab-controller";
import { controlLabTimeline } from "@/lib/teacher/teacher-surface-control";

import { auditLabTool } from "./teacher-audit";
import type { TeacherClientApi } from "./teacher-client-api";
import type { TeacherRuntime } from "./teacher-runtime";

export function createTeacherLabChangeTools(
	runtime: TeacherRuntime,
	api: TeacherClientApi,
) {
	const { controllers } = runtime;
	return {
		lab_explain: () =>
			auditLabTool(
				runtime,
				api,
				"plan-revealed",
				async () => (await controllers.getLab()?.explain()) ?? LAB_NOT_OPEN,
			),
		lab_apply_index: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"change-applied",
				async () =>
					(await controllers
						.getLab()
						?.applyIndex(
							String(params.sql ?? ""),
							String(params.rationale ?? ""),
							runtime.getLearnerTurn(),
						)) ?? LAB_NOT_OPEN,
			),
		lab_apply_rewrite: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"change-applied",
				async () =>
					(await controllers
						.getLab()
						?.applyRewrite(
							String(params.sql ?? ""),
							String(params.rationale ?? ""),
							runtime.getLearnerTurn(),
						)) ?? LAB_NOT_OPEN,
			),
		lab_review_alternatives: () =>
			auditLabTool(
				runtime,
				api,
				"alternatives-revealed",
				() => controllers.getLab()?.reviewAlternatives() ?? LAB_NOT_OPEN,
			),
		lab_reset_indexes: async () =>
			(await controllers.getLab()?.resetIndexes()) ?? LAB_NOT_OPEN,
		lab_ask_predict: (params: Record<string, unknown>) =>
			auditLabTool(
				runtime,
				api,
				"prediction-asked",
				() =>
					controllers
						.getLab()
						?.askPredict(
							String(params.question ?? ""),
							runtime.getLearnerTurn(),
						) ?? LAB_NOT_OPEN,
			),
		lab_timeline: (params: Record<string, unknown>) =>
			auditLabTool(runtime, api, null, () => {
				const lab = controllers.getLab();
				return lab ? controlLabTimeline(lab, params) : LAB_NOT_OPEN;
			}),
		lab_record_explanation: async (params: Record<string, unknown>) => {
			const conversationId = runtime.getConversationId();
			if (!conversationId) return "There is no active voice conversation.";
			return auditLabTool(
				runtime,
				api,
				params.correct === true ? "teachback-correct" : "teachback-incorrect",
				async () =>
					(await controllers
						.getLab()
						?.recordExplanation(
							conversationId,
							params.correct === true,
							String(params.rationale ?? ""),
							runtime.getLearnerTurn(),
						)) ?? LAB_NOT_OPEN,
			);
		},
	};
}

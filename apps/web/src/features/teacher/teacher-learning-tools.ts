import {
	isLearningSignalKind,
	type TeacherClientApi,
} from "./teacher-client-api";
import type { TeacherRuntime } from "./teacher-runtime";

export function createTeacherLearningTools(
	runtime: TeacherRuntime,
	api: TeacherClientApi,
) {
	return {
		remember: async (params: Record<string, unknown>) => {
			const key = String(params.key ?? "").trim();
			const value = String(params.value ?? "").trim();
			if (!key || !value) return "Nothing to save.";
			try {
				await api.learner.remember({ key, value });
				runtime.bumpEvidenceRevision();
				return "saved";
			} catch {
				return "Could not save that right now.";
			}
		},
		recall: async (params: Record<string, unknown>) => {
			const query = String(params.query ?? "").trim();
			if (!query) return "No memories found.";
			try {
				return await api.learner.recall({ query });
			} catch {
				return "Could not reach memory right now.";
			}
		},
		record_explanation: async (params: Record<string, unknown>) => {
			const conversationId = runtime.getConversationId();
			const entry = runtime.getCurrentExercise();
			if (!conversationId || !entry) {
				return "No active exercise conversation is available.";
			}
			if (params.exercise_id !== entry.exercise.id) {
				return "That explanation belongs to an exercise that is no longer open.";
			}
			const correct = params.correct === true;
			try {
				await api.practice.recordSignal({
					conversationId,
					kind: correct ? "explained-correctly" : "explained-incorrectly",
					concept: entry.lesson.id,
					rationale: String(params.rationale ?? "") || null,
				});
				runtime.bumpEvidenceRevision();
				return correct
					? "Recorded a correct explanation."
					: "Recorded the explanation gap for consolidation.";
			} catch {
				return "Could not record the explanation right now.";
			}
		},
		record_learning_signal: async (params: Record<string, unknown>) => {
			const conversationId = runtime.getConversationId();
			const kind = String(params.kind ?? "");
			if (!conversationId) return "There is no active voice conversation.";
			if (!isLearningSignalKind(kind)) return "Unknown learning signal.";

			const screen = runtime.getScreenContext();
			const entry = runtime.getCurrentExercise();
			let fullSolutionExerciseId: string | null = null;
			let concept: string;
			if (screen?.kind === "profile" && params.exercise_id === "profile") {
				concept = String(params.concept ?? "").trim();
				if (!concept) return "Name the profile concept this signal belongs to.";
			} else {
				if (!entry || params.exercise_id !== entry.exercise.id) {
					return "That signal belongs to an exercise that is no longer open.";
				}
				concept = entry.lesson.id;
				if (kind === "asked-for-answer") {
					fullSolutionExerciseId = entry.exercise.id;
				}
			}
			try {
				await api.practice.recordSignal({
					conversationId,
					kind,
					concept,
					rationale: String(params.rationale ?? "") || null,
				});
				if (fullSolutionExerciseId) {
					runtime.recordHintEvent(
						"full-solution-request",
						fullSolutionExerciseId,
					);
				}
				runtime.bumpEvidenceRevision();
				return "Recorded. The next replacement question can use this.";
			} catch {
				return "Could not record that learning signal right now.";
			}
		},
	};
}

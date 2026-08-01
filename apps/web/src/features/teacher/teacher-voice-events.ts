import type { useConversation } from "@elevenlabs/react";
import { toast } from "sonner";

import { teacherConnectionIssueFromError } from "@/lib/teacher/teacher-connection";

import type { TeacherAuditApi } from "./teacher-audit";
import type { createTeacherClientTools } from "./teacher-client-tools";
import type { TeacherRuntime } from "./teacher-runtime";

const VAD_TALKING_THRESHOLD = 0.6;

export function createTeacherConversationOptions(
	runtime: TeacherRuntime,
	clientTools: ReturnType<typeof createTeacherClientTools>,
	api: TeacherAuditApi,
): Parameters<typeof useConversation>[0] {
	return {
		clientTools,
		onConnect: ({ conversationId }) => {
			runtime.setConversationId(conversationId);
			runtime.setConnectionIssue(null);
		},
		onDisconnect: (details) => {
			const conversationId = runtime.getConversationId();
			const screen = runtime.getScreenContext();
			if (conversationId && screen?.kind === "optimization") {
				void api.practice
					.recordTeacherEvent({
						conversationId,
						problemId: screen.entityId ?? null,
						event: "session-ended",
						detail: "Voice connection ended.",
					})
					.catch((error) =>
						console.warn("[teacher-quality] disconnect audit failed", error),
					);
			}
			runtime.setConversationId(null);
			if (details.reason === "error") {
				runtime.setConnectionIssue(
					teacherConnectionIssueFromError(details.message),
				);
			}
			runtime.resetSentScreenContext();
			runtime.controllers.pauseActivePlayback();
		},
		onInterruption: runtime.controllers.pauseActivePlayback,
		onModeChange: ({ mode }) => {
			const lab = runtime.controllers.getLab();
			if (mode === "speaking") {
				lab?.timelineSpeechStarted();
				return;
			}
			lab?.timelineSpeechEnded();
		},
		onMessage: ({ message, source }) => {
			runtime.appendTranscript(source === "user" ? "user" : "agent", message);
			const conversationId = runtime.getConversationId();
			const screen = runtime.getScreenContext();
			if (
				source !== "user" &&
				conversationId &&
				screen?.kind === "optimization"
			) {
				void api.practice
					.recordTeacherEvent({
						conversationId,
						problemId: screen.entityId ?? null,
						event: "agent-response",
						detail: message,
					})
					.catch((error) =>
						console.warn("[teacher-quality] transcript audit failed", error),
					);
			}
		},
		onVadScore: ({ vadScore }) => {
			runtime.setUserTalking(vadScore > VAD_TALKING_THRESHOLD);
		},
		onError: (message) => {
			const issue = teacherConnectionIssueFromError(message);
			runtime.setConnectionIssue(issue);
			toast.error(issue.detail);
		},
	};
}

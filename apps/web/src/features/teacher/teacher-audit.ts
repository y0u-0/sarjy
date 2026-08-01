import type { TeacherQualityEvent } from "@sarjy-sql/api/lib/teacher-quality";

import { isLabBlocked } from "@/lib/optimize/lab-controller";

import type { TeacherRuntime } from "./teacher-runtime";

export interface TeacherAuditApi {
	practice: {
		recordTeacherEvent: (input: {
			conversationId: string;
			problemId: string | null;
			event: TeacherQualityEvent;
			detail: string;
		}) => Promise<unknown>;
	};
}

export async function auditLabTool(
	runtime: TeacherRuntime,
	api: TeacherAuditApi,
	event: TeacherQualityEvent | null,
	invoke: () => string | Promise<string>,
	problemId?: string,
): Promise<string> {
	const result = await invoke();
	const conversationId = runtime.getConversationId();
	const screen = runtime.getScreenContext();
	if (!conversationId || screen?.kind !== "optimization") return result;
	const recordedEvent = isLabBlocked(result) ? "guard-blocked" : event;
	if (!recordedEvent) return result;
	try {
		await api.practice.recordTeacherEvent({
			conversationId,
			problemId: problemId ?? screen.entityId ?? null,
			event: recordedEvent,
			detail: result,
		});
	} catch (error) {
		console.warn("[teacher-quality] could not record client tool", error);
	}
	return result;
}

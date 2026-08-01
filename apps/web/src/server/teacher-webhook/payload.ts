import { LEARNER_CONCEPTS } from "@sarjy-sql/api/lib/assessment-catalog";
import type { SessionInsightKind } from "@sarjy-sql/api/lib/practice-policy";

interface DataCollectionResult {
	value?: unknown;
	rationale?: string;
}

export interface TeacherWebhookPayload {
	type?: string;
	data?: {
		user_id?: string;
		conversation_id?: string;
		analysis?: {
			data_collection_results?: Record<string, DataCollectionResult>;
		};
		conversation_initiation_client_data?: {
			dynamic_variables?: Record<string, unknown>;
		};
	};
}

const INSIGHT_BY_FIELD: Record<string, SessionInsightKind> = {
	asked_for_answer: "asked-for-answer",
	explained_correctly: "explained-correctly",
	explained_incorrectly: "explained-incorrectly",
	requested_more_practice: "requested-more-practice",
	requested_to_move_on: "requested-to-move-on",
	reported_confusion: "reported-confusion",
};

function readBoolean(result: DataCollectionResult | undefined): boolean {
	return result?.value === true || result?.value === "true";
}

export function parseTeacherWebhookPayload(
	rawBody: string,
): TeacherWebhookPayload | null {
	try {
		return JSON.parse(rawBody) as TeacherWebhookPayload;
	} catch {
		return null;
	}
}

export function extractTeacherSession(payload: TeacherWebhookPayload) {
	const data = payload.data;
	const fallbackUserId =
		data?.conversation_initiation_client_data?.dynamic_variables?.user_id;
	const userId =
		data?.user_id ??
		(typeof fallbackUserId === "string" ? fallbackUserId : undefined);
	const conversationId = data?.conversation_id;
	if (!userId || !conversationId) return null;

	const collected = data?.analysis?.data_collection_results ?? {};
	const reportedConcept =
		typeof collected.focus_concept?.value === "string"
			? collected.focus_concept.value
			: null;
	const concept =
		reportedConcept && LEARNER_CONCEPTS.has(reportedConcept)
			? reportedConcept
			: null;
	const insights = Object.entries(INSIGHT_BY_FIELD)
		.filter(([field]) => readBoolean(collected[field]))
		.map(([field, kind]) => ({
			kind,
			concept,
			rationale: collected[field]?.rationale ?? null,
		}));

	return { userId, conversationId, insights };
}

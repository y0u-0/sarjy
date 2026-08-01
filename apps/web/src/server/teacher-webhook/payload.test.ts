import { describe, expect, it } from "bun:test";

import { extractTeacherSession, parseTeacherWebhookPayload } from "./payload";

describe("teacher webhook payload", () => {
	it("extracts explicit learning signals for a known concept", () => {
		const payload = parseTeacherWebhookPayload(
			JSON.stringify({
				data: {
					user_id: "learner-1",
					conversation_id: "conversation-1",
					analysis: {
						data_collection_results: {
							focus_concept: { value: "joins" },
							reported_confusion: {
								value: true,
								rationale: "The learner asked how rows match.",
							},
							asked_for_answer: { value: false },
						},
					},
				},
			}),
		);

		expect(payload).not.toBeNull();
		expect(extractTeacherSession(payload ?? {})).toEqual({
			userId: "learner-1",
			conversationId: "conversation-1",
			insights: [
				{
					kind: "reported-confusion",
					concept: "joins",
					rationale: "The learner asked how rows match.",
				},
			],
		});
	});

	it("keeps unknown concepts out of the learner model", () => {
		const session = extractTeacherSession({
			data: {
				user_id: "learner-1",
				conversation_id: "conversation-1",
				analysis: {
					data_collection_results: {
						focus_concept: { value: "made-up-concept" },
						requested_more_practice: { value: "true" },
					},
				},
			},
		});

		expect(session?.insights).toEqual([
			{
				kind: "requested-more-practice",
				concept: null,
				rationale: null,
			},
		]);
	});
});

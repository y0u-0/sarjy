import {
	appendTeacherQualityEvent,
	recordSessionInsights,
} from "@sarjy-sql/api/lib/practice";
import { env } from "@sarjy-sql/env/server";

import { extractTeacherSession, parseTeacherWebhookPayload } from "./payload";
import { verifyElevenLabsWebhookSignature } from "./signature";

export async function handleTeacherWebhook(
	request: Request,
): Promise<Response> {
	const rawBody = await request.text();
	const secret = env.ELEVENLABS_WEBHOOK_SECRET;
	if (!secret) {
		console.warn("[teacher-webhook] no secret configured; ignoring delivery");
		return new Response("ok", { status: 200 });
	}

	if (
		!verifyElevenLabsWebhookSignature({
			rawBody,
			header: request.headers.get("ElevenLabs-Signature"),
			secret,
		})
	) {
		console.warn("[teacher-webhook] signature rejected");
		return new Response("ok", { status: 200 });
	}

	const payload = parseTeacherWebhookPayload(rawBody);
	if (!payload || payload.type === "post_call_audio") {
		return new Response("ok", { status: 200 });
	}

	const session = extractTeacherSession(payload);
	if (!session) {
		console.warn("[teacher-webhook] delivery without user or conversation id");
		return new Response("ok", { status: 200 });
	}

	try {
		const outcome = await recordSessionInsights(session);
		if (outcome === "unknown-user") {
			console.warn(`[teacher-webhook] no such user: ${session.userId}`);
		}
		if (outcome === "recorded") {
			await appendTeacherQualityEvent({
				userId: session.userId,
				conversationId: session.conversationId,
				problemId: null,
				event: "session-ended",
				detail: "Post-call analysis completed.",
			});
		}
	} catch (error) {
		console.error("[teacher-webhook] failed to record insights", error);
		return new Response("error", { status: 500 });
	}

	return new Response("ok", { status: 200 });
}

import { describe, expect, it } from "bun:test";
import { createHmac } from "node:crypto";

import { verifyElevenLabsWebhookSignature } from "./signature";

function signature(rawBody: string, timestamp: number, secret: string) {
	return `t=${timestamp},v0=${createHmac("sha256", secret)
		.update(`${timestamp}.${rawBody}`)
		.digest("hex")}`;
}

describe("ElevenLabs webhook signature", () => {
	it("accepts a current matching signature", () => {
		const nowSeconds = 2_000_000_000;
		const rawBody = '{"type":"post_call_transcription"}';
		const secret = "test-secret";

		expect(
			verifyElevenLabsWebhookSignature({
				rawBody,
				header: signature(rawBody, nowSeconds, secret),
				secret,
				nowSeconds,
			}),
		).toBe(true);
	});

	it("rejects a matching signature outside the stale tolerance", () => {
		const nowSeconds = 2_000_000_000;
		const rawBody = "{}";
		const secret = "test-secret";
		const staleTimestamp = nowSeconds - 30 * 60 - 1;

		expect(
			verifyElevenLabsWebhookSignature({
				rawBody,
				header: signature(rawBody, staleTimestamp, secret),
				secret,
				nowSeconds,
			}),
		).toBe(false);
	});

	it("accepts any matching signature during key rotation", () => {
		const nowSeconds = 2_000_000_000;
		const rawBody = "{}";
		const secret = "test-secret";
		const valid = signature(rawBody, nowSeconds, secret).split(",")[1];

		expect(
			verifyElevenLabsWebhookSignature({
				rawBody,
				header: `t=${nowSeconds},v0=wrong,${valid}`,
				secret,
				nowSeconds,
			}),
		).toBe(true);
	});
});

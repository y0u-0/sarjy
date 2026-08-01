import { createHmac, timingSafeEqual } from "node:crypto";

/** One-sided, matching the vendor SDK: reject stale, and separately reject future. */
const TOLERANCE_SECS = 30 * 60;
const FUTURE_TOLERANCE_SECS = 5 * 60;

interface VerifyWebhookSignatureInput {
	rawBody: string;
	header: string | null;
	secret: string;
	nowSeconds?: number;
}

export function verifyElevenLabsWebhookSignature({
	rawBody,
	header,
	secret,
	nowSeconds = Math.floor(Date.now() / 1000),
}: VerifyWebhookSignatureInput): boolean {
	if (!header) return false;

	let timestamp: string | null = null;
	const signatures: string[] = [];
	for (const part of header.split(",")) {
		const piece = part.trim();
		if (piece.startsWith("t=")) timestamp = piece.slice(2);
		else if (piece.startsWith("v0=")) signatures.push(piece);
	}
	if (!timestamp || signatures.length === 0) return false;

	const sent = Number(timestamp);
	if (!Number.isFinite(sent)) return false;
	if (sent < nowSeconds - TOLERANCE_SECS) return false;
	if (sent > nowSeconds + FUTURE_TOLERANCE_SECS) return false;

	const expected = `v0=${createHmac("sha256", secret)
		.update(`${timestamp}.${rawBody}`)
		.digest("hex")}`;
	const expectedBytes = Buffer.from(expected);

	return signatures.some((candidate) => {
		const candidateBytes = Buffer.from(candidate);
		return (
			candidateBytes.length === expectedBytes.length &&
			timingSafeEqual(candidateBytes, expectedBytes)
		);
	});
}

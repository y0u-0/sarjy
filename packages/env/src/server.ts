import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		ELEVENLABS_API_KEY: z.string().min(1).optional(),
		ELEVENLABS_AGENT_ID: z.string().min(1).optional(),
		// Shared secret for post-call webhook HMAC. Without it the webhook route
		// ignores every delivery rather than trusting unsigned input.
		ELEVENLABS_WEBHOOK_SECRET: z.string().min(1).optional(),
		// Semantic memory. All three must be present for Tier 2 to switch on; with
		// any of them missing the app falls back to the SQL-backed recall, so a
		// missing key degrades the feature instead of breaking the app.
		OPENAI_API_KEY: z.string().min(1).optional(),
		QDRANT_URL: z.url().optional(),
		QDRANT_API_KEY: z.string().min(1).optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});

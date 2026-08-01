import { MISCONCEPTION_KINDS } from "@sarjy-sql/db/schema/memory";
import { CONFIDENCE_LEVELS } from "@sarjy-sql/db/schema/practice";
import { z } from "zod";

export const ATTEMPT_INPUT = z.object({
	exerciseId: z.string().min(1).max(100),
	concept: z.string().min(1).max(100),
	sql: z.string().max(10_000),
	passed: z.boolean(),
	kind: z.enum(MISCONCEPTION_KINDS).nullable().default(null),
	elapsedMs: z.number().int().min(0).max(86_400_000),
	predicted: z.enum(CONFIDENCE_LEVELS).nullable().default(null),
	hintShown: z.boolean().default(false),
	gaveUp: z.boolean().default(false),
});

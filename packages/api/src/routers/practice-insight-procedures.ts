import { ORPCError } from "@orpc/server";
import {
	SESSION_INSIGHT_KINDS,
	TEACHER_QUALITY_EVENTS,
} from "@sarjy-sql/db/schema/practice";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { LEARNER_CONCEPTS } from "../lib/assessment-catalog";
import {
	appendSessionInsight,
	appendTeacherQualityEvent,
	recordSessionInsights,
} from "../lib/practice";

const insightInput = z.object({
	kind: z.enum(SESSION_INSIGHT_KINDS),
	concept: z.string().min(1).max(100).nullable().default(null),
	rationale: z.string().max(2000).nullable().default(null),
});

export const practiceInsightProcedures = {
	recordTeacherEvent: protectedProcedure
		.input(
			z.object({
				conversationId: z.string().min(1).max(200),
				problemId: z.string().min(1).max(100).nullable().default(null),
				event: z.enum(TEACHER_QUALITY_EVENTS),
				detail: z.string().max(2000).nullable().default(null),
			}),
		)
		.handler(async ({ context, input }) =>
			appendTeacherQualityEvent({
				userId: context.session.user.id,
				...input,
			}),
		),

	recordSignal: protectedProcedure
		.input(
			insightInput.extend({
				conversationId: z.string().min(1).max(200),
			}),
		)
		.handler(async ({ context, input }) => {
			if (input.concept !== null && !LEARNER_CONCEPTS.has(input.concept)) {
				throw new ORPCError("BAD_REQUEST");
			}
			await appendSessionInsight({
				userId: context.session.user.id,
				conversationId: input.conversationId,
				insight: {
					kind: input.kind,
					concept: input.concept,
					rationale: input.rationale,
				},
			});
			return { recorded: true };
		}),

	recordInsights: protectedProcedure
		.input(
			z.object({
				conversationId: z.string().min(1).max(200),
				insights: z.array(insightInput).max(20),
			}),
		)
		.handler(async ({ context, input }) => {
			await recordSessionInsights({
				userId: context.session.user.id,
				conversationId: input.conversationId,
				insights: input.insights,
			});
		}),
};

import { z } from "zod";
import { protectedProcedure } from "../index";
import {
	composeLearnerBrief,
	deleteVisibleMemory,
	listVisibleMemories,
	searchFacts,
	upsertFact,
} from "../lib/learner-memory";

export const learnerRouter = {
	brief: protectedProcedure.handler(({ context }) =>
		composeLearnerBrief(context.session.user.id),
	),

	memories: protectedProcedure.handler(({ context }) =>
		listVisibleMemories(context.session.user.id),
	),

	forgetMemory: protectedProcedure
		.input(z.object({ id: z.number().int().positive() }))
		.handler(async ({ context, input }) => ({
			deleted: await deleteVisibleMemory({
				userId: context.session.user.id,
				id: input.id,
			}),
		})),

	remember: protectedProcedure
		.input(
			z.object({
				key: z.string().min(1).max(80),
				value: z.string().min(1).max(500),
			}),
		)
		.handler(async ({ context, input }) => {
			await upsertFact({
				userId: context.session.user.id,
				key: input.key.toLowerCase().trim(),
				value: input.value.trim(),
			});
			return "saved";
		}),

	recall: protectedProcedure
		.input(z.object({ query: z.string().min(1).max(200) }))
		.handler(async ({ context, input }) => {
			const facts = await searchFacts({
				userId: context.session.user.id,
				query: input.query.toLowerCase().trim(),
			});
			if (facts.length === 0) return "No memories found.";
			return facts.map((fact) => `${fact.key}: ${fact.value}`).join("; ");
		}),
};

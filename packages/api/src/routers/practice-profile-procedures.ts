import { z } from "zod";

import { protectedProcedure } from "../index";
import { reviewDueAt } from "../lib/mastery";
import {
	conceptSignalsFor,
	profileFor,
	profileHistoryFor,
	unlockExercises,
	unlockedFor,
} from "../lib/practice";
import { decide } from "../lib/practice-policy";

export const practiceProfileProcedures = {
	recommend: protectedProcedure
		.input(
			z.object({
				concept: z.string().min(1).max(100),
				poolIds: z.array(z.string().min(1).max(100)).max(50).default([]),
			}),
		)
		.handler(async ({ context, input }) => {
			const signals = await conceptSignalsFor(
				context.session.user.id,
				input.concept,
			);
			const recommendation = decide(signals);
			const unlocked = await unlockExercises({
				userId: context.session.user.id,
				concept: input.concept,
				candidateIds: input.poolIds,
				count: recommendation.unlockCount,
				reason: recommendation.reason,
			});

			return {
				recommendation,
				newlyUnlocked: unlocked,
				available: await unlockedFor(context.session.user.id, input.concept),
				signals: {
					mastery: signals.mastery,
					opportunities: signals.opportunities,
					consecutiveFailures: signals.consecutiveFailures,
					calibration: signals.calibration,
					recentKinds: signals.recentKinds,
				},
			};
		}),

	profile: protectedProcedure
		.input(
			z.object({
				concepts: z.array(z.string().min(1).max(100)).min(1).max(50),
			}),
		)
		.handler(async ({ context, input }) => {
			const profiles = await profileFor(
				context.session.user.id,
				input.concepts,
			);
			return profiles.map((entry) => ({
				...entry,
				current: entry.mastery,
				reviewDueAt: entry.lastSeenAt
					? reviewDueAt(entry.mastery, entry.lastSeenAt)
					: null,
			}));
		}),

	history: protectedProcedure
		.input(
			z.object({
				concepts: z.array(z.string().min(1).max(100)).min(1).max(50),
			}),
		)
		.handler(async ({ context, input }) =>
			profileHistoryFor(context.session.user.id, input.concepts),
		),

	unlocked: protectedProcedure
		.input(z.object({ concept: z.string().min(1).max(100) }))
		.handler(async ({ context, input }) =>
			unlockedFor(context.session.user.id, input.concept),
		),
};

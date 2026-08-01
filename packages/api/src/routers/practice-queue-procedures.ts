import { ORPCError } from "@orpc/server";
import { STARTING_POINT_LEVELS } from "@sarjy-sql/db/schema/practice";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { ASSESSMENT_CANDIDATES } from "../lib/assessment-catalog";
import { ensureExerciseQueue, resolveAssignedExercise } from "../lib/practice";
import {
	saveStartingPoint,
	startingPointStateFor,
} from "../lib/practice-starting-point";
import { candidatesForStartingPoint } from "../lib/starting-point";

export const practiceQueueProcedures = {
	queue: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;
		const startingPoint = await startingPointStateFor(userId);
		if (startingPoint.kind === "interview") return [];
		return ensureExerciseQueue({ userId, candidates: ASSESSMENT_CANDIDATES });
	}),

	startingPoint: protectedProcedure.handler(({ context }) =>
		startingPointStateFor(context.session.user.id),
	),

	completeStartingPoint: protectedProcedure
		.input(
			z.object({
				level: z.enum(STARTING_POINT_LEVELS),
				rationale: z.string().trim().min(1).max(500),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const current = await startingPointStateFor(userId);
			if (current.kind === "ready" && current.level === null) {
				throw new ORPCError("CONFLICT");
			}
			const { startingPoint, created } =
				current.kind === "ready"
					? { startingPoint: current, created: false }
					: await saveStartingPoint({
							userId,
							...input,
							source: "interview",
						});
			const questions = await ensureExerciseQueue({
				userId,
				candidates: candidatesForStartingPoint(
					ASSESSMENT_CANDIDATES,
					startingPoint.level,
				),
				selectionReason: "Matched to your starting-point interview with Sarjy",
			});
			return { startingPoint, questions, created };
		}),

	skip: protectedProcedure
		.input(z.object({ exerciseId: z.string().min(1).max(100) }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const resolved = await resolveAssignedExercise({
				userId,
				exerciseId: input.exerciseId,
				status: "skipped",
			});
			if (!resolved) throw new ORPCError("CONFLICT");
			return ensureExerciseQueue({ userId, candidates: ASSESSMENT_CANDIDATES });
		}),
};

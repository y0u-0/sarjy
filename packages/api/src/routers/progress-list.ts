import { db } from "@sarjy-sql/db";
import { exerciseProgress } from "@sarjy-sql/db/schema/progress";
import { eq } from "drizzle-orm";

import { protectedProcedure } from "../index";

export const listProgress = protectedProcedure.handler(async ({ context }) => {
	const rows = await db
		.select({
			exerciseId: exerciseProgress.exerciseId,
			attempts: exerciseProgress.attempts,
			completedAt: exerciseProgress.completedAt,
		})
		.from(exerciseProgress)
		.where(eq(exerciseProgress.userId, context.session.user.id));
	return rows.map((row) => ({
		exerciseId: row.exerciseId,
		attempts: row.attempts,
		completed: row.completedAt !== null,
	}));
});

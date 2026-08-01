import { sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const exerciseProgress = sqliteTable(
	"exercise_progress",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		exerciseId: text("exercise_id").notNull(),
		attempts: integer("attempts").default(0).notNull(),
		completedAt: integer("completed_at", { mode: "timestamp_ms" }),
		lastSql: text("last_sql"),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("exercise_progress_user_exercise_idx").on(
			table.userId,
			table.exerciseId,
		),
	],
);

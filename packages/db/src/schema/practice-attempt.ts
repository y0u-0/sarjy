import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import type { MisconceptionKind } from "./memory";
import type { ConfidenceLevel } from "./practice-types";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** Append-only evidence used by mastery and adaptive practice. */
export const attempt = sqliteTable(
	"attempt",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		exerciseId: text("exercise_id").notNull(),
		concept: text("concept").notNull(),
		sql: text("sql").notNull(),
		passed: integer("passed", { mode: "boolean" }).notNull(),
		kind: text("kind").$type<MisconceptionKind>(),
		elapsedMs: integer("elapsed_ms").notNull(),
		ordinal: integer("ordinal").notNull(),
		predicted: text("predicted").$type<ConfidenceLevel>(),
		hintShown: integer("hint_shown", { mode: "boolean" })
			.default(false)
			.notNull(),
		gaveUp: integer("gave_up", { mode: "boolean" }).default(false).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [
		index("attempt_user_concept_idx").on(table.userId, table.concept),
		index("attempt_user_exercise_idx").on(table.userId, table.exerciseId),
	],
);

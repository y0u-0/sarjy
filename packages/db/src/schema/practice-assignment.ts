import { sql } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import type {
	ExerciseQueueStatus,
	StartingPointLevel,
	StartingPointSource,
} from "./practice-types";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** Held-back exercises previously offered to a learner. */
export const exerciseUnlock = sqliteTable(
	"exercise_unlock",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		exerciseId: text("exercise_id").notNull(),
		concept: text("concept").notNull(),
		reason: text("reason").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [
		index("exercise_unlock_user_concept_idx").on(table.userId, table.concept),
	],
);

/** Stable three-slot queue; resolved rows remain as assignment history. */
export const exerciseQueueItem = sqliteTable(
	"exercise_queue_item",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		exerciseId: text("exercise_id").notNull(),
		concept: text("concept").notNull(),
		difficulty: integer("difficulty").notNull(),
		slot: integer("slot"),
		status: text("status").$type<ExerciseQueueStatus>().notNull(),
		selectionReason: text("selection_reason").notNull(),
		assignedAt: integer("assigned_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		uniqueIndex("exercise_queue_user_exercise_idx").on(
			table.userId,
			table.exerciseId,
		),
		uniqueIndex("exercise_queue_user_slot_idx").on(table.userId, table.slot),
		index("exercise_queue_user_status_idx").on(table.userId, table.status),
	],
);

/** Bounded first-run placement that yields to graded evidence afterwards. */
export const practiceStartingPoint = sqliteTable("practice_starting_point", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	level: text("level").$type<StartingPointLevel>().notNull(),
	source: text("source").$type<StartingPointSource>().notNull(),
	rationale: text("rationale").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(now)
		.notNull(),
});

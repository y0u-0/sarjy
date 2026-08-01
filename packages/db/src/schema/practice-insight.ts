import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import type { SessionInsightKind, TeacherQualityEvent } from "./practice-types";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** Transcript evidence restricted to explicit, auditable learner statements. */
export const sessionInsight = sqliteTable(
	"session_insight",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		conversationId: text("conversation_id").notNull(),
		concept: text("concept"),
		kind: text("kind").$type<SessionInsightKind>().notNull(),
		rationale: text("rationale"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [
		index("session_insight_user_idx").on(table.userId, table.concept),
		index("session_insight_conversation_idx").on(table.conversationId),
	],
);

/** Append-only trace of Sarjy's optimization teaching behavior. */
export const teacherQualityEvent = sqliteTable(
	"teacher_quality_event",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		conversationId: text("conversation_id").notNull(),
		problemId: text("problem_id"),
		event: text("event").$type<TeacherQualityEvent>().notNull(),
		detail: text("detail"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [
		index("teacher_quality_conversation_idx").on(table.conversationId),
		index("teacher_quality_user_idx").on(table.userId, table.createdAt),
	],
);

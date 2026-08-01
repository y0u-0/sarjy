import { sql } from "drizzle-orm";
import {
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const conceptMastery = sqliteTable(
	"concept_mastery",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		concept: text("concept").notNull(),
		successes: integer("successes").default(0).notNull(),
		failures: integer("failures").default(0).notNull(),
		mastery: real("mastery").default(0).notNull(),
		lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		reviewDueAt: integer("review_due_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		uniqueIndex("concept_mastery_user_concept_idx").on(
			table.userId,
			table.concept,
		),
	],
);

export const MISCONCEPTION_KINDS = [
	"wrong-columns",
	"wrong-row-count",
	"wrong-order",
	"wrong-values",
	"different-result",
	"no-plan-improvement",
	"sql-error",
] as const;

export type MisconceptionKind = (typeof MISCONCEPTION_KINDS)[number];

export const misconception = sqliteTable(
	"misconception",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		concept: text("concept").notNull(),
		kind: text("kind").$type<MisconceptionKind>().notNull(),
		count: integer("count").default(1).notNull(),
		lastSql: text("last_sql"),
		lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		uniqueIndex("misconception_user_concept_kind_idx").on(
			table.userId,
			table.concept,
			table.kind,
		),
	],
);

export const LEARNER_FACT_SOURCES = ["agent", "derived"] as const;

export type LearnerFactSource = (typeof LEARNER_FACT_SOURCES)[number];

export const learnerFact = sqliteTable(
	"learner_fact",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		key: text("key").notNull(),
		value: text("value").notNull(),
		source: text("source")
			.$type<LearnerFactSource>()
			.default("agent")
			.notNull(),
		confidence: real("confidence").default(1).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [
		uniqueIndex("learner_fact_user_key_idx").on(table.userId, table.key),
	],
);

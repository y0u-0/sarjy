import { db } from "@sarjy-sql/db";
import { user } from "@sarjy-sql/db/schema/auth";
import {
	type SessionInsightKind,
	sessionInsight,
	type TeacherQualityEvent,
	teacherQualityEvent,
} from "@sarjy-sql/db/schema/practice";
import { and, asc, eq, sql } from "drizzle-orm";

import { analyzeTeacherQuality } from "./teacher-quality";

export type InsightOutcome = "recorded" | "unknown-user";

export async function appendSessionInsight(params: {
	userId: string;
	conversationId: string;
	insight: {
		kind: SessionInsightKind;
		concept: string | null;
		rationale: string | null;
	};
}): Promise<void> {
	const [existing] = await db
		.select({ id: sessionInsight.id })
		.from(sessionInsight)
		.where(
			and(
				eq(sessionInsight.userId, params.userId),
				eq(sessionInsight.conversationId, params.conversationId),
				eq(sessionInsight.kind, params.insight.kind),
				params.insight.concept === null
					? sql`${sessionInsight.concept} is null`
					: eq(sessionInsight.concept, params.insight.concept),
				params.insight.rationale === null
					? sql`${sessionInsight.rationale} is null`
					: eq(sessionInsight.rationale, params.insight.rationale),
			),
		)
		.limit(1);
	if (existing) return;
	await db.insert(sessionInsight).values({
		userId: params.userId,
		conversationId: params.conversationId,
		concept: params.insight.concept,
		kind: params.insight.kind,
		rationale: params.insight.rationale,
	});
}

export async function recordSessionInsights(params: {
	userId: string;
	conversationId: string;
	insights: {
		kind: SessionInsightKind;
		concept: string | null;
		rationale: string | null;
	}[];
}): Promise<InsightOutcome> {
	const [owner] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.id, params.userId))
		.limit(1);
	if (!owner) return "unknown-user";
	if (params.insights.length === 0) return "recorded";
	for (const insight of params.insights) {
		await appendSessionInsight({
			userId: params.userId,
			conversationId: params.conversationId,
			insight,
		});
	}
	return "recorded";
}

export async function appendTeacherQualityEvent(params: {
	userId: string;
	conversationId: string;
	problemId: string | null;
	event: TeacherQualityEvent;
	detail: string | null;
}): Promise<ReturnType<typeof analyzeTeacherQuality>> {
	await db.insert(teacherQualityEvent).values(params);
	const events = await db
		.select({
			event: teacherQualityEvent.event,
			problemId: teacherQualityEvent.problemId,
			detail: teacherQualityEvent.detail,
		})
		.from(teacherQualityEvent)
		.where(
			and(
				eq(teacherQualityEvent.userId, params.userId),
				eq(teacherQualityEvent.conversationId, params.conversationId),
			),
		)
		.orderBy(asc(teacherQualityEvent.createdAt), asc(teacherQualityEvent.id));
	const audit = analyzeTeacherQuality(events);
	console.info(
		"[teacher-quality]",
		JSON.stringify({
			conversationId: params.conversationId,
			latestEvent: params.event,
			problemId: params.problemId,
			audit,
		}),
	);
	return audit;
}

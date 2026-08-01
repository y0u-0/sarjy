import { db } from "@sarjy-sql/db";
import {
	type LearnerFactSource,
	learnerFact,
} from "@sarjy-sql/db/schema/memory";
import { and, desc, eq, like, or } from "drizzle-orm";

import {
	forgetUser,
	recallSemantic,
	rememberSemantic,
} from "./semantic-memory";

const MAX_FACTS = 8;
const semanticRebuilds = new Map<string, Promise<void>>();

function normalizedMemory(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

async function rebuildSemanticFacts(userId: string): Promise<void> {
	const facts = await db
		.select({ key: learnerFact.key, value: learnerFact.value })
		.from(learnerFact)
		.where(eq(learnerFact.userId, userId))
		.orderBy(learnerFact.createdAt);
	await forgetUser(userId);
	for (const fact of facts) {
		await rememberSemantic(userId, `${fact.key} is ${fact.value}`);
	}
}

function scheduleSemanticRebuild(userId: string): void {
	const previous = semanticRebuilds.get(userId) ?? Promise.resolve();
	const next = previous
		.catch(() => undefined)
		.then(() => rebuildSemanticFacts(userId))
		.catch((error) => {
			console.error("[learner-memory] semantic rebuild failed", error);
		})
		.finally(() => {
			if (semanticRebuilds.get(userId) === next)
				semanticRebuilds.delete(userId);
		});
	semanticRebuilds.set(userId, next);
}

export async function upsertFact(params: {
	userId: string;
	key: string;
	value: string;
	source?: LearnerFactSource;
}): Promise<void> {
	const now = new Date();
	const source = params.source ?? "agent";
	await db
		.insert(learnerFact)
		.values({
			userId: params.userId,
			key: params.key,
			value: params.value,
			source,
			lastSeenAt: now,
		})
		.onConflictDoUpdate({
			target: [learnerFact.userId, learnerFact.key],
			set: { value: params.value, source, confidence: 1, lastSeenAt: now },
		});
	scheduleSemanticRebuild(params.userId);
}

export async function searchFacts(params: {
	userId: string;
	query: string;
}): Promise<{ key: string; value: string }[]> {
	const needle = `%${params.query.toLowerCase()}%`;
	const exact = await db
		.select({ key: learnerFact.key, value: learnerFact.value })
		.from(learnerFact)
		.where(
			and(
				eq(learnerFact.userId, params.userId),
				or(like(learnerFact.key, needle), like(learnerFact.value, needle)),
			),
		)
		.orderBy(desc(learnerFact.lastSeenAt))
		.limit(MAX_FACTS);
	if (exact.length > 0) return exact;
	const [semantic, canonical] = await Promise.all([
		recallSemantic(params.userId, params.query).catch(() => []),
		db
			.select({ key: learnerFact.key, value: learnerFact.value })
			.from(learnerFact)
			.where(eq(learnerFact.userId, params.userId))
			.orderBy(desc(learnerFact.lastSeenAt)),
	]);
	return canonical
		.filter((fact) => {
			const key = normalizedMemory(fact.key);
			const value = normalizedMemory(fact.value);
			return semantic.some((memory) => {
				const text = normalizedMemory(memory.text);
				return text.includes(key) || text.includes(value);
			});
		})
		.slice(0, MAX_FACTS);
}

export async function deleteVisibleMemory(params: {
	userId: string;
	id: number;
}): Promise<boolean> {
	const deleted = await db
		.delete(learnerFact)
		.where(
			and(eq(learnerFact.userId, params.userId), eq(learnerFact.id, params.id)),
		)
		.returning({ id: learnerFact.id });
	if (deleted.length === 0) return false;
	scheduleSemanticRebuild(params.userId);
	return true;
}

export interface VisibleLearnerMemory {
	facts: {
		id: number;
		key: string;
		value: string;
		source: LearnerFactSource;
		confidence: number;
		lastSeenAt: Date;
	}[];
}

export async function listVisibleMemories(
	userId: string,
): Promise<VisibleLearnerMemory> {
	const facts = await db
		.select({
			id: learnerFact.id,
			key: learnerFact.key,
			value: learnerFact.value,
			source: learnerFact.source,
			confidence: learnerFact.confidence,
			lastSeenAt: learnerFact.lastSeenAt,
		})
		.from(learnerFact)
		.where(eq(learnerFact.userId, userId))
		.orderBy(desc(learnerFact.lastSeenAt));
	return { facts };
}

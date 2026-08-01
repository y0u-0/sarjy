import { db } from "@sarjy-sql/db";
import {
	learnerFact,
	type MisconceptionKind,
} from "@sarjy-sql/db/schema/memory";
import { desc, eq } from "drizzle-orm";

import { LEARNER_CONCEPTS } from "./assessment-catalog";
import { preferredLearnerName } from "./learner-name";
import { isMastered, isShaky } from "./mastery";
import { profileFor } from "./practice-profile";

const MAX_FACTS = 8;
const MAX_MISCONCEPTIONS = 3;

function describeMisconception(kind: MisconceptionKind): string {
	switch (kind) {
		case "wrong-columns":
			return "selecting the wrong columns";
		case "wrong-row-count":
			return "filtering to the wrong number of rows";
		case "wrong-order":
			return "forgetting ORDER BY";
		case "wrong-values":
			return "right shape, wrong values";
		case "different-result":
			return "optimization rewrites that change the answer";
		case "no-plan-improvement":
			return "changes that leave the expensive query plan in place";
		case "sql-error":
			return "syntax errors";
	}
}

function relativeDays(from: Date, now: Date): string {
	const days = Math.floor((now.getTime() - from.getTime()) / 86_400_000);
	if (days <= 0) return "today";
	if (days === 1) return "yesterday";
	return `${days} days ago`;
}

async function learnerEvidenceFor(userId: string) {
	const [facts, profiles] = await Promise.all([
		db
			.select({ key: learnerFact.key, value: learnerFact.value })
			.from(learnerFact)
			.where(eq(learnerFact.userId, userId))
			.orderBy(desc(learnerFact.lastSeenAt)),
		profileFor(userId, [...LEARNER_CONCEPTS]),
	]);
	return { facts, profiles };
}

function briefFromEvidence(
	{ facts, profiles }: Awaited<ReturnType<typeof learnerEvidenceFor>>,
	now: Date,
): string {
	const started = profiles.filter((profile) => profile.opportunities > 0);
	if (facts.length === 0 && started.length === 0) {
		return "This is your first session with this student. You know nothing about them yet.";
	}
	const lines: string[] = [];
	if (facts.length > 0) {
		lines.push(
			`What you know about them: ${facts
				.slice(0, MAX_FACTS)
				.map((fact) => `${fact.key} is ${fact.value}`)
				.join("; ")}.`,
		);
	}
	if (started.length > 0) {
		lines.push(
			`Concept mastery from the append-only submission ledger (0-1): ${started
				.map(
					(profile) =>
						`${profile.concept} ${profile.mastery.toFixed(2)}${
							isShaky(profile.mastery)
								? " (shaky)"
								: isMastered(profile.mastery)
									? " (solid)"
									: ""
						}`,
				)
				.join(", ")}.`,
		);
		const due = started
			.filter((profile) => isShaky(profile.mastery))
			.map((profile) => profile.concept);
		if (due.length > 0) lines.push(`Worth revisiting: ${due.join(", ")}.`);
		const lastSeen = started.reduce<Date | null>(
			(latest, profile) =>
				profile.lastSeenAt && (latest === null || profile.lastSeenAt > latest)
					? profile.lastSeenAt
					: latest,
			null,
		);
		if (lastSeen)
			lines.push(`Their last session was ${relativeDays(lastSeen, now)}.`);
	}
	const misconceptions = profiles
		.flatMap((profile) =>
			profile.mistakes.map((mistake) => ({
				concept: profile.concept,
				...mistake,
			})),
		)
		.sort((left, right) => right.count - left.count)
		.slice(0, MAX_MISCONCEPTIONS);
	if (misconceptions.length > 0) {
		lines.push(
			`Recurring mistakes: ${misconceptions
				.map(
					(row) =>
						`on ${row.concept}, ${describeMisconception(row.kind)} (${row.count}x)`,
				)
				.join("; ")}.`,
		);
	}
	return lines.join(" ");
}

export async function composeLearnerBrief(userId: string): Promise<string> {
	return briefFromEvidence(await learnerEvidenceFor(userId), new Date());
}

export async function composeLearnerVoiceContext(
	userId: string,
	accountName: string,
): Promise<{ learnerBrief: string; studentName: string }> {
	const evidence = await learnerEvidenceFor(userId);
	return {
		learnerBrief: briefFromEvidence(evidence, new Date()),
		studentName: preferredLearnerName(accountName, evidence.facts),
	};
}

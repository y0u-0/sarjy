import { db } from "@sarjy-sql/db";
import type { MisconceptionKind } from "@sarjy-sql/db/schema/memory";
import { attempt, sessionInsight } from "@sarjy-sql/db/schema/practice";
import { and, asc, eq } from "drizzle-orm";

import { foldMastery } from "./mastery";
import { tallyCalibration } from "./practice-policy-signals";
import type { ConceptSignals } from "./practice-policy-types";
import {
	collapseAttemptEpisodes,
	type LoggedAttempt,
	SESSION_GAP_MS,
} from "./profile-history";

const TRAJECTORY_WINDOW = 6;
const CALIBRATION_WINDOW = 12;

export function replayMastery(
	attempts: LoggedAttempt[],
	now: Date = new Date(),
): { mastery: number; everMastered: boolean } {
	const episodes = collapseAttemptEpisodes(attempts);
	return foldMastery(
		episodes.map((row) => ({
			passed: row.passed,
			kind: row.kind,
			elapsedMs: row.elapsedMs,
			ordinal: row.ordinal,
			retries: row.submissions - 1,
			assisted: row.hintShown || row.gaveUp,
			createdAt: row.createdAt,
		})),
		now,
	);
}

function countCurrentSession(attempts: LoggedAttempt[], now: Date): number {
	let count = 0;
	let cursor = now.getTime();
	for (const row of [...attempts].reverse()) {
		const at = row.createdAt.getTime();
		if (cursor - at > SESSION_GAP_MS) break;
		count += 1;
		cursor = at;
	}
	return count;
}

function countConsecutiveFailures(attempts: LoggedAttempt[]): number {
	let count = 0;
	for (const row of [...attempts].reverse()) {
		if (row.passed) break;
		count += 1;
	}
	return count;
}

export async function conceptSignalsFor(
	userId: string,
	concept: string,
	now: Date = new Date(),
): Promise<ConceptSignals> {
	const [attempts, spoken] = await Promise.all([
		db
			.select({
				exerciseId: attempt.exerciseId,
				concept: attempt.concept,
				passed: attempt.passed,
				kind: attempt.kind,
				elapsedMs: attempt.elapsedMs,
				ordinal: attempt.ordinal,
				predicted: attempt.predicted,
				hintShown: attempt.hintShown,
				gaveUp: attempt.gaveUp,
				createdAt: attempt.createdAt,
			})
			.from(attempt)
			.where(and(eq(attempt.userId, userId), eq(attempt.concept, concept)))
			.orderBy(asc(attempt.createdAt)),
		db
			.select({
				id: sessionInsight.id,
				kind: sessionInsight.kind,
				createdAt: sessionInsight.createdAt,
			})
			.from(sessionInsight)
			.where(
				and(
					eq(sessionInsight.userId, userId),
					eq(sessionInsight.concept, concept),
				),
			)
			.orderBy(asc(sessionInsight.createdAt), asc(sessionInsight.id)),
	]);
	const { mastery, everMastered } = replayMastery(attempts, now);
	const episodes = collapseAttemptEpisodes(attempts);
	const sessionStart = now.getTime() - SESSION_GAP_MS;
	const latestExplanation = [...spoken]
		.reverse()
		.find(
			(row) =>
				row.kind === "explained-correctly" ||
				row.kind === "explained-incorrectly",
		);
	const recentKinds = episodes
		.filter((row) => !row.passed && row.kind !== null)
		.slice(-TRAJECTORY_WINDOW)
		.reverse()
		.map((row) => row.kind as MisconceptionKind);
	return {
		concept,
		mastery,
		opportunities: episodes.length,
		opportunitiesThisSession: countCurrentSession(episodes, now),
		consecutiveFailures: countConsecutiveFailures(attempts),
		recentKinds,
		calibration: tallyCalibration(episodes.slice(-CALIBRATION_WINDOW)),
		spokenSignals: spoken
			.filter((row) => row.createdAt.getTime() >= sessionStart)
			.map((row) => row.kind),
		explanation:
			latestExplanation?.kind === "explained-correctly"
				? "correct"
				: latestExplanation?.kind === "explained-incorrectly"
					? "incorrect"
					: null,
		distinctPassedExercises: new Set(
			episodes.filter((row) => row.passed).map((row) => row.exerciseId),
		).size,
		unassistedPasses: episodes.filter(
			(row) => row.passed && !row.hintShown && !row.gaveUp,
		).length,
		everMastered,
	};
}

import type { MisconceptionKind } from "@sarjy-sql/db/schema/memory";
import type { ConfidenceLevel } from "@sarjy-sql/db/schema/practice";

import { foldMastery } from "./mastery";

/**
 * A gap this long ends a session. Chosen so that stepping away for coffee does not
 * reset the per-session practice cap, while coming back in the evening does.
 * PRODUCT — no empirical basis, and nothing important turns on it.
 */
export const SESSION_GAP_MS = 30 * 60 * 1000;

export interface LoggedAttempt {
	exerciseId: string;
	concept: string;
	passed: boolean;
	kind: MisconceptionKind | null;
	elapsedMs: number;
	ordinal: number;
	predicted: ConfidenceLevel | null;
	hintShown: boolean;
	gaveUp: boolean;
	createdAt: Date;
}

/**
 * One independent encounter with an exercise. Raw submissions remain in the
 * ledger, but retries inside one continuous encounter are one mastery opportunity.
 */
export interface AttemptEpisode extends LoggedAttempt {
	submissions: number;
}

export interface HistoricalConceptProfile {
	concept: string;
	current: number;
	opportunities: number;
	passes: number;
}

export interface ProfileHistorySnapshot {
	id: string;
	sessionNumber: number;
	startedAt: Date;
	endedAt: Date;
	attempts: number;
	totalAttempts: number;
	profiles: HistoricalConceptProfile[];
}

/**
 * Consolidate retries without deleting them.
 *
 * The final result represents the episode, while `submissions` and the summed
 * elapsed time retain how much work it took. Seeing the same exercise again after
 * a real session gap is a new recall opportunity and therefore a new episode.
 */
export function collapseAttemptEpisodes(
	attempts: LoggedAttempt[],
): AttemptEpisode[] {
	const ordered = [...attempts].sort(
		(left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
	);
	const episodes: LoggedAttempt[][] = [];
	const activeByExercise = new Map<
		string,
		{ rows: LoggedAttempt[]; lastAttemptAt: Date }
	>();

	for (const row of ordered) {
		const key = `${row.concept}\u0000${row.exerciseId}`;
		const active = activeByExercise.get(key);
		if (
			active &&
			row.createdAt.getTime() - active.lastAttemptAt.getTime() <= SESSION_GAP_MS
		) {
			active.rows.push(row);
			active.lastAttemptAt = row.createdAt;
			continue;
		}

		const rows = [row];
		episodes.push(rows);
		activeByExercise.set(key, { rows, lastAttemptAt: row.createdAt });
	}

	return episodes.map((rows) => {
		const last = rows.at(-1);
		if (!last) throw new Error("An attempt episode cannot be empty.");
		const passing = [...rows].reverse().find((row) => row.passed);
		const result = passing ?? last;
		return {
			...result,
			passed: passing !== undefined,
			kind: passing ? null : result.kind,
			elapsedMs: rows.reduce((sum, row) => sum + row.elapsedMs, 0),
			// Mastery can distinguish a first-submit solution from a corrected one.
			ordinal: rows.length,
			predicted: rows.find((row) => row.predicted !== null)?.predicted ?? null,
			hintShown: rows.some((row) => row.hintShown),
			gaveUp: rows.some((row) => row.gaveUp),
			createdAt: last.createdAt,
			submissions: rows.length,
		};
	});
}

function masteryAt(attempts: LoggedAttempt[], now: Date): number {
	return foldMastery(
		collapseAttemptEpisodes(attempts).map((row) => ({
			passed: row.passed,
			kind: row.kind,
			elapsedMs: row.elapsedMs,
			ordinal: row.ordinal,
			retries: row.submissions - 1,
			assisted: row.hintShown || row.gaveUp,
			createdAt: row.createdAt,
		})),
		now,
	).mastery;
}

/**
 * Rebuild the learner model at the end of each earlier study session.
 *
 * The newest session is deliberately omitted because it is already represented by
 * the current profile. That makes the default overlay a genuine before/after
 * comparison even when the learner returns after the 30-minute session boundary.
 * No synthetic baseline is inserted: one session alone is not enough evidence to
 * claim improvement across sessions.
 */
export function buildProfileHistory(
	attempts: LoggedAttempt[],
	concepts: string[],
): ProfileHistorySnapshot[] {
	const ordered = [...attempts].sort(
		(left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
	);
	if (ordered.length === 0) return [];

	const sessions: LoggedAttempt[][] = [];
	for (const row of ordered) {
		const current = sessions.at(-1);
		const previous = current?.at(-1);
		if (
			!current ||
			!previous ||
			row.createdAt.getTime() - previous.createdAt.getTime() > SESSION_GAP_MS
		) {
			sessions.push([row]);
			continue;
		}
		current.push(row);
	}

	const comparisonSessions = sessions.slice(0, -1).slice(-12);
	const firstSessionNumber = sessions.length - comparisonSessions.length;

	return comparisonSessions.map((session, index) => {
		const endedAt = session.at(-1)?.createdAt;
		const startedAt = session[0]?.createdAt;
		if (!(startedAt && endedAt)) {
			throw new Error("A profile history session cannot be empty.");
		}
		const cumulative = ordered.filter(
			(row) => row.createdAt.getTime() <= endedAt.getTime(),
		);
		const sessionEpisodes = collapseAttemptEpisodes(session);
		const cumulativeEpisodes = collapseAttemptEpisodes(cumulative);
		const sessionNumber = firstSessionNumber + index;

		return {
			id: `session-${sessionNumber}-${endedAt.getTime()}`,
			sessionNumber,
			startedAt,
			endedAt,
			attempts: sessionEpisodes.length,
			totalAttempts: cumulativeEpisodes.length,
			profiles: concepts.map((concept) => {
				const rawMine = cumulative.filter((row) => row.concept === concept);
				const mine = cumulativeEpisodes.filter(
					(row) => row.concept === concept,
				);
				return {
					concept,
					current: masteryAt(rawMine, endedAt),
					opportunities: mine.length,
					passes: mine.filter((row) => row.passed).length,
				};
			}),
		};
	});
}

import type { MisconceptionKind } from "@sarjy-sql/db/schema/memory";

/**
 * The structured half of Sarjy's memory: a running estimate, per concept, of how
 * well the student knows it. Drives three things — the learner brief injected
 * into Sarjy's prompt at session start, which exercise gets offered next, and
 * whether Sarjy treats a concept as shaky enough to show rather than ask.
 *
 * Mastery is a 0..1 scalar. Values are only ever produced by `nextMastery` and
 * only ever read back through `decayedMastery`, so callers never see a raw
 * stored value that has not been aged.
 */

export const MASTERY_FLOOR = 0;
export const MASTERY_CEILING = 1;

/**
 * At or above this, a concept counts as learned and stops being offered.
 *
 * 0.95 matches the threshold Cognitive Tutor has shipped since Corbett &
 * Anderson (1995) and the probability gate Khan Academy replaced "ten correct in
 * a row" with — a change that cut problems-per-proficiency from 16.8 to 12.4
 * while next-problem accuracy held at 0.95. A threshold beats a streak because
 * it lets strong evidence arrive early.
 */
export const MASTERY_THRESHOLD = 0.95;

/** Below this, Sarjy treats the concept as shaky and leans on showing. */
export const MASTERY_SHAKY = 0.45;

/** Days of no practice after which a concept decays to ~half its mastery. */
const HALF_LIFE_DAYS = 10;

/**
 * Step size for the moving average, before the attempt's persuasiveness is
 * applied. Pelánek's intensity table indexes this on an item's median solving
 * time; every exercise here is a multi-line query that takes well over 40
 * seconds, which is his top band.
 *
 * At this weight a clean run reaches MASTERY_THRESHOLD in five passes, and the
 * identity T = 1 - (1 - w)^N means it can be read as an exact "five in a row"
 * without inheriting a streak's brittleness.
 */
const EMA_WEIGHT = 0.5;

/**
 * Submissions faster than this on a *second or later* attempt are treated as
 * non-answers and carry the full penalty — Pelánek's "don't know / don't care"
 * class. Never applied to a first attempt: fast first attempts are correct 77%
 * of the time while fast later attempts are correct 43% of the time, so the same
 * speed means opposite things depending on where it lands.
 */
const NON_ANSWER_MS = 500;

/** Below this nothing was decided — a double-click or a held keyboard repeat. */
export const DISCARD_ATTEMPT_MS = 200;

const MS_PER_DAY = 86_400_000;

export interface AttemptSignal {
	mastery: number;
	passed: boolean;
	kind: MisconceptionKind | null;
	elapsedMs: number;
	/** 1-based position of this attempt within the exercise. */
	ordinal: number;
	/** Corrections made during this exercise episode; raw submissions stay logged. */
	retries?: number;
	/** True when the learner saw a hint or full solution before this pass. */
	assisted: boolean;
}

export interface TimedAttemptSignal extends AttemptSignal {
	createdAt: Date;
}

function clamp(value: number): number {
	return Math.min(MASTERY_CEILING, Math.max(MASTERY_FLOOR, value));
}

/**
 * How much a given failure should move the estimate.
 *
 * Graded by how persistent that error class is in practice. Taipalus's 987-student
 * study found syntax and semantic errors get fixed by the student unaided, while
 * logical errors survive into the final submitted answer — so a parse error is
 * mostly noise about what someone knows, and a wrong row set is mostly signal.
 */
function failurePersuasiveness(kind: MisconceptionKind | null): number {
	switch (kind) {
		case "sql-error":
			return 0.2;
		case "wrong-order":
		case "wrong-columns":
			return 0.4;
		case "wrong-row-count":
		case "wrong-values":
		case "different-result":
		case "no-plan-improvement":
			return 0.75;
		default:
			return 0.75;
	}
}

/**
 * Ebbinghaus-style exponential forgetting. Knowledge you have not touched in a
 * while should not keep claiming to be mastered, otherwise the review scheduler
 * never resurfaces anything and "personalized" degrades into "linear".
 *
 * FSRS's power curve fits real review data better than an exponential, but it
 * needs per-item stability estimates this app has no data to fit. An exponential
 * with a bounded half-life is the honest version at this sample size.
 */
export function decayedMastery(
	mastery: number,
	lastSeenAt: Date,
	now: Date = new Date(),
): number {
	const idleDays = Math.max(
		0,
		(now.getTime() - lastSeenAt.getTime()) / MS_PER_DAY,
	);
	return clamp(mastery * 0.5 ** (idleDays / HALF_LIFE_DAYS));
}

/**
 * When this concept should resurface. Stronger mastery earns a longer interval,
 * which is the whole point of spaced repetition: review at the edge of
 * forgetting, not on a fixed cadence.
 */
export function reviewDueAt(mastery: number, now: Date = new Date()): Date {
	const intervalDays = 1 + clamp(mastery) * 20;
	return new Date(now.getTime() + intervalDays * MS_PER_DAY);
}

export function isShaky(mastery: number): boolean {
	return mastery < MASTERY_SHAKY;
}

export function isMastered(mastery: number): boolean {
	return mastery >= MASTERY_THRESHOLD;
}

/**
 * Fold a single graded attempt into the running mastery estimate.
 *
 * A plain exponential moving average toward 0 (failed) or 1 (passed), weighted by
 * how much this particular attempt deserves to be believed. Pelánek's comparison
 * of mastery criteria found that what you feed the estimator and where you put
 * the threshold matter more than which estimator you pick — so this is an EMA
 * rather than a fitted knowledge-tracing model, and the interesting work happens
 * in the weight.
 */
export function nextMastery(signal: AttemptSignal): number {
	const target = signal.passed ? MASTERY_CEILING : MASTERY_FLOOR;
	const nonAnswer = signal.ordinal > 1 && signal.elapsedMs < NON_ANSWER_MS;

	const persuasiveness = signal.passed
		? signal.assisted
			? 0.5
			: signal.retries && signal.retries > 0
				? 0.65
				: 1
		: nonAnswer
			? 1
			: failurePersuasiveness(signal.kind);

	const weight = EMA_WEIGHT * persuasiveness;
	return clamp(signal.mastery + (target - signal.mastery) * weight);
}

/** One timestamp-aware fold shared by policy/profile replays and unit tests. */
export function foldMastery(
	attempts: Omit<TimedAttemptSignal, "mastery">[],
	now: Date = new Date(),
): { mastery: number; everMastered: boolean } {
	let mastery = 0;
	let everMastered = false;
	let lastSeenAt: Date | null = null;

	for (const attempt of attempts) {
		if (lastSeenAt)
			mastery = decayedMastery(mastery, lastSeenAt, attempt.createdAt);
		mastery = nextMastery({ ...attempt, mastery });
		if (isMastered(mastery)) everMastered = true;
		lastSeenAt = attempt.createdAt;
	}

	if (lastSeenAt) mastery = decayedMastery(mastery, lastSeenAt, now);
	return { mastery, everMastered };
}

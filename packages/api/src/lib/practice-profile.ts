import { db } from "@sarjy-sql/db";
import type { MisconceptionKind } from "@sarjy-sql/db/schema/memory";
import { attempt, sessionInsight } from "@sarjy-sql/db/schema/practice";
import { asc, eq } from "drizzle-orm";
import {
	classifyTrajectory,
	tallyCalibration,
} from "./practice-policy-signals";
import type { CalibrationTally, Trajectory } from "./practice-policy-types";
import { replayMastery } from "./practice-signals";
import {
	buildProfileHistory,
	collapseAttemptEpisodes,
	type ProfileHistorySnapshot,
} from "./profile-history";

const TRAJECTORY_WINDOW = 6;
const CALIBRATION_WINDOW = 12;

export interface ConceptProfile {
	concept: string;
	mastery: number;
	submissions: number;
	opportunities: number;
	passes: number;
	trajectory: Trajectory;
	mistakes: { kind: MisconceptionKind; count: number }[];
	calibration: CalibrationTally;
	lastSeenAt: Date | null;
	everMastered: boolean;
	unassistedPasses: number;
	assistedPasses: number;
	explanation: "correct" | "incorrect" | null;
}

function attemptSelection() {
	return {
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
	};
}

export async function profileHistoryFor(
	userId: string,
	concepts: string[],
): Promise<ProfileHistorySnapshot[]> {
	const rows = await db
		.select(attemptSelection())
		.from(attempt)
		.where(eq(attempt.userId, userId))
		.orderBy(asc(attempt.createdAt));
	return buildProfileHistory(rows, concepts);
}

export async function profileFor(
	userId: string,
	concepts: string[],
): Promise<ConceptProfile[]> {
	const [rows, explanations] = await Promise.all([
		db
			.select(attemptSelection())
			.from(attempt)
			.where(eq(attempt.userId, userId))
			.orderBy(asc(attempt.createdAt)),
		db
			.select({
				id: sessionInsight.id,
				concept: sessionInsight.concept,
				kind: sessionInsight.kind,
				createdAt: sessionInsight.createdAt,
			})
			.from(sessionInsight)
			.where(eq(sessionInsight.userId, userId))
			.orderBy(asc(sessionInsight.createdAt), asc(sessionInsight.id)),
	]);

	return concepts.map((concept) => {
		const mine = rows.filter((row) => row.concept === concept);
		const episodes = collapseAttemptEpisodes(mine);
		const { mastery, everMastered } = replayMastery(mine);
		const failures = episodes.filter(
			(row): row is (typeof episodes)[number] & { kind: MisconceptionKind } =>
				!row.passed && row.kind !== null,
		);
		const counts = new Map<MisconceptionKind, number>();
		for (const row of failures)
			counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1);
		const latestExplanation = [...explanations]
			.reverse()
			.find(
				(row) =>
					row.concept === concept &&
					(row.kind === "explained-correctly" ||
						row.kind === "explained-incorrectly"),
			);
		return {
			concept,
			mastery,
			submissions: mine.length,
			opportunities: episodes.length,
			passes: episodes.filter((row) => row.passed).length,
			trajectory: classifyTrajectory(
				failures
					.slice(-TRAJECTORY_WINDOW)
					.reverse()
					.map((row) => row.kind),
			),
			mistakes: [...counts]
				.map(([kind, count]) => ({ kind, count }))
				.sort((left, right) => right.count - left.count),
			calibration: tallyCalibration(episodes.slice(-CALIBRATION_WINDOW)),
			lastSeenAt: mine.at(-1)?.createdAt ?? null,
			everMastered,
			unassistedPasses: episodes.filter(
				(row) => row.passed && !row.hintShown && !row.gaveUp,
			).length,
			assistedPasses: episodes.filter(
				(row) => row.passed && (row.hintShown || row.gaveUp),
			).length,
			explanation:
				latestExplanation?.kind === "explained-correctly"
					? "correct"
					: latestExplanation?.kind === "explained-incorrectly"
						? "incorrect"
						: null,
		};
	});
}

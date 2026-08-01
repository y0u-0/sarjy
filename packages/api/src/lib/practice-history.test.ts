import { describe, expect, test } from "bun:test";

import {
	buildProfileHistory,
	collapseAttemptEpisodes,
	type LoggedAttempt,
} from "./profile-history";

function attemptAt(params: {
	minute: number;
	concept?: string;
	passed?: boolean;
	exerciseId?: string;
}): LoggedAttempt {
	return {
		exerciseId: params.exerciseId ?? `exercise-${params.minute}`,
		concept: params.concept ?? "joins",
		passed: params.passed ?? true,
		kind: params.passed === false ? "different-result" : null,
		elapsedMs: 10_000,
		ordinal: 1,
		predicted: null,
		hintShown: false,
		gaveUp: false,
		createdAt: new Date(Date.UTC(2026, 6, 1, 9, params.minute)),
	};
}

describe("profile session history", () => {
	test("six retries on one exercise are one evidence opportunity", () => {
		const retries = Array.from({ length: 6 }, (_, index) =>
			attemptAt({
				minute: index,
				exerciseId: "same-exercise",
				passed: false,
			}),
		);

		const episodes = collapseAttemptEpisodes(retries);
		expect(episodes).toHaveLength(1);
		expect(episodes[0]).toMatchObject({
			exerciseId: "same-exercise",
			passed: false,
			submissions: 6,
			ordinal: 6,
		});
	});

	test("a corrected solution is one pass with its retry cost retained", () => {
		const episodes = collapseAttemptEpisodes([
			attemptAt({ minute: 0, exerciseId: "same", passed: false }),
			attemptAt({ minute: 2, exerciseId: "same", passed: false }),
			attemptAt({ minute: 4, exerciseId: "same", passed: true }),
		]);

		expect(episodes).toHaveLength(1);
		expect(episodes[0]).toMatchObject({
			passed: true,
			kind: null,
			submissions: 3,
			ordinal: 3,
			elapsedMs: 30_000,
		});
	});

	test("the same exercise after a session gap is a new recall opportunity", () => {
		const episodes = collapseAttemptEpisodes([
			attemptAt({ minute: 0, exerciseId: "same", passed: false }),
			attemptAt({ minute: 40, exerciseId: "same", passed: true }),
		]);

		expect(episodes).toHaveLength(2);
	});

	test("other practice does not merge hours-apart encounters", () => {
		const episodes = collapseAttemptEpisodes([
			attemptAt({ minute: 0, exerciseId: "same", passed: false }),
			attemptAt({ minute: 20, exerciseId: "other", passed: true }),
			attemptAt({ minute: 40, exerciseId: "same", passed: true }),
		]);

		expect(episodes).toHaveLength(3);
		expect(episodes.filter((row) => row.exerciseId === "same")).toHaveLength(2);
	});

	test("does not manufacture a comparison from one session", () => {
		const history = buildProfileHistory(
			[attemptAt({ minute: 0 }), attemptAt({ minute: 10 })],
			["joins"],
		);

		expect(history).toEqual([]);
	});

	test("uses the completed earlier session as the comparison snapshot", () => {
		const history = buildProfileHistory(
			[
				attemptAt({ minute: 0, passed: false }),
				attemptAt({ minute: 10 }),
				attemptAt({ minute: 50, concept: "subqueries" }),
			],
			["joins", "subqueries"],
		);

		expect(history).toHaveLength(1);
		expect(history[0]?.attempts).toBe(2);
		expect(history[0]?.totalAttempts).toBe(2);
		expect(
			history[0]?.profiles.find((row) => row.concept === "joins"),
		).toMatchObject({ opportunities: 2, passes: 1 });
		expect(
			history[0]?.profiles.find((row) => row.concept === "subqueries"),
		).toMatchObject({ opportunities: 0, passes: 0, current: 0 });
	});

	test("each snapshot excludes attempts from later sessions", () => {
		const history = buildProfileHistory(
			[
				attemptAt({ minute: 0, passed: false }),
				attemptAt({ minute: 40 }),
				attemptAt({ minute: 80 }),
			],
			["joins"],
		);

		expect(history).toHaveLength(2);
		expect(history.map((snapshot) => snapshot.totalAttempts)).toEqual([1, 2]);
		expect(history[0]?.profiles[0]).toMatchObject({
			opportunities: 1,
			passes: 0,
		});
		expect(history[1]?.profiles[0]).toMatchObject({
			opportunities: 2,
			passes: 1,
		});
	});

	test("snapshot totals count exercise episodes, not submit-button presses", () => {
		const history = buildProfileHistory(
			[
				attemptAt({ minute: 0, exerciseId: "same", passed: false }),
				attemptAt({ minute: 2, exerciseId: "same", passed: false }),
				attemptAt({ minute: 4, exerciseId: "same", passed: true }),
				attemptAt({ minute: 50, exerciseId: "later" }),
			],
			["joins"],
		);

		expect(history).toHaveLength(1);
		expect(history[0]).toMatchObject({ attempts: 1, totalAttempts: 1 });
		expect(history[0]?.profiles[0]).toMatchObject({
			opportunities: 1,
			passes: 1,
		});
	});
});

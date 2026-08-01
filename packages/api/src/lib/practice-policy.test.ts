import { describe, expect, test } from "bun:test";

import { foldMastery } from "./mastery";
import { type ConceptSignals, decide } from "./practice-policy";

function signals(overrides: Partial<ConceptSignals> = {}): ConceptSignals {
	return {
		concept: "optimization-indexes",
		mastery: 0.97,
		opportunities: 6,
		opportunitiesThisSession: 6,
		consecutiveFailures: 0,
		recentKinds: [],
		calibration: {
			alignedConfident: 0,
			overconfident: 0,
			underconfident: 0,
			alignedUnsure: 0,
		},
		spokenSignals: [],
		explanation: "correct",
		distinctPassedExercises: 2,
		unassistedPasses: 2,
		everMastered: true,
		...overrides,
	};
}

describe("explanation-aware practice decisions", () => {
	test("advances only with transfer, unassisted success, and a correct explanation", () => {
		expect(decide(signals()).action).toBe("advance");
		expect(decide(signals({ distinctPassedExercises: 1 })).action).toBe(
			"practise",
		);
		expect(decide(signals({ unassistedPasses: 0 })).action).toBe("consolidate");
		expect(decide(signals({ explanation: null })).action).toBe("consolidate");
		expect(decide(signals({ explanation: "incorrect" })).action).toBe(
			"consolidate",
		);
	});

	test("an explicit move-on request remains a soft override", () => {
		expect(
			decide(
				signals({
					explanation: "incorrect",
					spokenSignals: ["requested-to-move-on"],
				}),
			).action,
		).toBe("advance");
	});

	test("the latest spoken practice preference wins", () => {
		expect(
			decide(
				signals({
					spokenSignals: ["requested-more-practice", "requested-to-move-on"],
				}),
			).action,
		).toBe("advance");
		expect(
			decide(
				signals({
					spokenSignals: ["requested-to-move-on", "requested-more-practice"],
				}),
			).action,
		).toBe("practise");
	});

	test("underconfidence cannot bypass transfer and teach-back evidence", () => {
		const calibration = {
			alignedConfident: 0,
			overconfident: 0,
			underconfident: 2,
			alignedUnsure: 0,
		};
		expect(
			decide(
				signals({
					mastery: 0.8,
					calibration,
					distinctPassedExercises: 1,
				}),
			).action,
		).toBe("practise");
		expect(
			decide(signals({ mastery: 0.8, calibration, explanation: null })).action,
		).toBe("consolidate");
	});
});

test("mastery replay decays across real time gaps", () => {
	const start = new Date("2026-01-01T00:00:00.000Z");
	const attempts = Array.from({ length: 5 }, (_, index) => ({
		exerciseId: `exercise-${index}`,
		concept: "select-basics",
		passed: true,
		kind: null,
		elapsedMs: 30_000,
		ordinal: 1,
		predicted: null,
		hintShown: false,
		gaveUp: false,
		createdAt: new Date(start.getTime() + index * 60_000),
	}));
	const timedSignals = attempts.map((attempt) => ({
		passed: attempt.passed,
		kind: attempt.kind,
		elapsedMs: attempt.elapsedMs,
		ordinal: attempt.ordinal,
		assisted: attempt.hintShown || attempt.gaveUp,
		createdAt: attempt.createdAt,
	}));
	const immediate = foldMastery(
		timedSignals,
		attempts.at(-1)?.createdAt ?? start,
	);
	const tenDaysLater = foldMastery(
		timedSignals,
		new Date(start.getTime() + 10 * 86_400_000),
	);

	expect(immediate.mastery).toBeGreaterThan(0.95);
	expect(tenDaysLater.mastery).toBeLessThan(0.55);
	expect(tenDaysLater.everMastered).toBe(true);
});

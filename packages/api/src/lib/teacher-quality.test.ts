import { describe, expect, test } from "bun:test";

import { analyzeTeacherQuality } from "./teacher-quality";

describe("optimization teacher-quality audit", () => {
	test("flags early reveals and unfinished teaching cycles without scoring the learner", () => {
		const audit = analyzeTeacherQuality([
			{ event: "plan-revealed", problemId: "idx-country" },
			{ event: "interpretation-recorded", problemId: "idx-country" },
			{ event: "guidance-selected", problemId: "idx-country" },
			{ event: "change-applied", problemId: "idx-country" },
			{ event: "guard-blocked", problemId: "idx-country" },
			{
				event: "agent-response",
				problemId: "idx-country",
				detail: Array.from({ length: 61 }, () => "word").join(" "),
			},
			{ event: "session-ended", problemId: null },
		]);

		expect(audit.visualBeforeGuidance).toBe(1);
		expect(audit.visualBeforeInterpretation).toBe(1);
		expect(audit.predictionsWithoutObservation).toBe(0);
		expect(audit.changesWithoutPrediction).toBe(1);
		expect(audit.changesWithoutTeachback).toBe(1);
		expect(audit.teachbacksWithoutAlternativeReview).toBe(0);
		expect(audit.blockedActions).toBe(1);
		expect(audit.longAgentTurns).toBe(1);
		expect(audit.prematureSolutionReveals).toBe(0);
		expect(audit.completedCycles).toBe(0);
	});

	test("recognizes a complete conversation-first teaching cycle", () => {
		const audit = analyzeTeacherQuality([
			{ event: "interpretation-recorded", problemId: "idx-country" },
			{ event: "guidance-selected", problemId: "idx-country" },
			{ event: "plan-revealed", problemId: "idx-country" },
			{ event: "observation-recorded", problemId: "idx-country" },
			{ event: "data-observation-recorded", problemId: "idx-country" },
			{ event: "prediction-asked", problemId: "idx-country" },
			{ event: "prediction-recorded", problemId: "idx-country" },
			{ event: "change-applied", problemId: "idx-country" },
			{ event: "correctness-recorded", problemId: "idx-country" },
			{ event: "comparison-recorded", problemId: "idx-country" },
			{ event: "alternatives-revealed", problemId: "idx-country" },
			{ event: "alternatives-reviewed", problemId: "idx-country" },
			{ event: "teachback-correct", problemId: "idx-country" },
			{ event: "session-ended", problemId: null },
		]);

		expect(audit).toEqual({
			visualBeforeGuidance: 0,
			visualBeforeInterpretation: 0,
			predictionsWithoutObservation: 0,
			changesWithoutPrediction: 0,
			changesWithoutTeachback: 0,
			teachbacksWithoutAlternativeReview: 0,
			blockedActions: 0,
			longAgentTurns: 0,
			prematureSolutionReveals: 0,
			completedCycles: 1,
		});
	});

	test("flags a teach-back that skips problem-specific alternative review", () => {
		const audit = analyzeTeacherQuality([
			{ event: "interpretation-recorded", problemId: "idx-country" },
			{ event: "guidance-selected", problemId: "idx-country" },
			{ event: "observation-recorded", problemId: "idx-country" },
			{ event: "prediction-asked", problemId: "idx-country" },
			{ event: "prediction-recorded", problemId: "idx-country" },
			{ event: "change-applied", problemId: "idx-country" },
			{ event: "teachback-correct", problemId: "idx-country" },
		]);

		expect(audit.teachbacksWithoutAlternativeReview).toBe(1);
	});

	test("flags a concrete optimization reveal before the prediction checkpoint", () => {
		const audit = analyzeTeacherQuality([
			{ event: "interpretation-recorded", problemId: "idx-country" },
			{ event: "guidance-selected", problemId: "idx-country" },
			{
				event: "agent-response",
				problemId: "idx-country",
				detail: "What changes if we add an index on country?",
			},
		]);

		expect(audit.prematureSolutionReveals).toBe(1);
	});
});

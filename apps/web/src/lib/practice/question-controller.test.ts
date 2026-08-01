import { expect, test } from "bun:test";

import {
	decideSubmissionEvidence,
	isEvidenceForCurrentExercise,
	nextAssignedQuestionId,
} from "./question-controller";

test("records attempts until and including the first successful submission", () => {
	expect(decideSubmissionEvidence(false, false)).toEqual({
		record: true,
		accepted: false,
	});
	expect(decideSubmissionEvidence(false, true)).toEqual({
		record: true,
		accepted: true,
	});
});

test("keeps acceptance sticky and ignores every later result as evidence", () => {
	expect(decideSubmissionEvidence(true, false)).toEqual({
		record: false,
		accepted: true,
	});
	expect(decideSubmissionEvidence(true, true)).toEqual({
		record: false,
		accepted: true,
	});
});

test("hides recommendation evidence after exercise navigation", () => {
	expect(isEvidenceForCurrentExercise("previous", "current")).toBe(false);
	expect(isEvidenceForCurrentExercise("current", "current")).toBe(true);
});

test("opens the adaptive replacement in the current question slot", () => {
	expect(
		nextAssignedQuestionId(
			[
				{ exerciseId: "existing-a", slot: 0 },
				{ exerciseId: "replacement", slot: 1 },
				{ exerciseId: "existing-c", slot: 2 },
			],
			"resolved",
			1,
		),
	).toBe("replacement");
});

test("never navigates back to the question being moved", () => {
	expect(
		nextAssignedQuestionId(
			[
				{ exerciseId: "current", slot: 1 },
				{ exerciseId: "other", slot: 2 },
			],
			"current",
			1,
		),
	).toBe("other");
});

test("returns null when the queue has no other assigned question", () => {
	expect(
		nextAssignedQuestionId([{ exerciseId: "current", slot: 0 }], "current", 0),
	).toBeNull();
});

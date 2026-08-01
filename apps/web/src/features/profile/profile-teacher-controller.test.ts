import { expect, test } from "bun:test";
import type { ProfileEvidenceRow } from "./profile-model";
import { createProfileTeacherController } from "./profile-teacher-controller";

const joins = {
	concept: "joins",
	current: 0.5,
	opportunities: 2,
	passes: 1,
	calibration: {
		alignedConfident: 1,
		overconfident: 0,
		underconfident: 0,
		alignedUnsure: 1,
	},
} as ProfileEvidenceRow;

test("lets the teacher change view, comparison, and spotlight through one seam", () => {
	let view: "learn" | "optimization" = "optimization";
	let comparisonId: string | null = null;
	let focusedConcept: string | null = null;
	let focusNote: string | null = null;
	let revealCount = 0;
	const controller = createProfileTeacherController({
		getProfile: () => [joins],
		getHistory: () => [
			{
				id: "session-1",
				sessionNumber: 1,
				endedAt: "2026-07-31T10:00:00Z",
				attempts: 1,
				totalAttempts: 1,
				profiles: [],
			},
		],
		getView: () => view,
		getComparisonId: () => comparisonId,
		getFocusedConcept: () => focusedConcept,
		setView: (next) => {
			view = next;
		},
		setComparisonId: (next) => {
			comparisonId = next;
		},
		setFocus: (concept, note) => {
			focusedConcept = concept;
			focusNote = note;
		},
		markViewControlled: () => {},
		revealLandscape: () => {
			revealCount += 1;
		},
	});

	expect(controller.setView("learn")).toContain("learn topics");
	expect(controller.compareSession("previous")).toContain("session 1");
	expect(controller.focusTopic("Joins", "Review this")).toContain(
		"Current evidence is 1/2",
	);
	expect(view as string).toBe("learn");
	expect(comparisonId as string | null).toBe("session-1");
	expect(focusedConcept as string | null).toBe("joins");
	expect(focusNote as string | null).toBe("Review this");
	expect(revealCount).toBe(3);
});

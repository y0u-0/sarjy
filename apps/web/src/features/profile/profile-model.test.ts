import { expect, test } from "bun:test";

import type { ProfileEvidenceRow } from "./profile-model";
import {
	buildProfileEvidenceModel,
	initialSkillLandscapeView,
	profileScreenSummary,
	resolveProfileConcept,
} from "./profile-model";

function row(
	concept: string,
	opportunities: number,
	passes: number,
): ProfileEvidenceRow {
	return {
		concept,
		current: passes / Math.max(opportunities, 1),
		opportunities,
		passes,
		trajectory: "mixed",
		mistakes: [],
		lastSeenAt: null,
		everMastered: false,
		unassistedPasses: passes,
		assistedPasses: 0,
		explanation: null,
		calibration: {
			alignedConfident: passes,
			overconfident: 0,
			underconfident: 0,
			alignedUnsure: opportunities - passes,
		},
	};
}

test("derives profile counts once from independent exercise episodes", () => {
	const evidence = buildProfileEvidenceModel([
		row("joins", 4, 3),
		row("filtering", 0, 0),
	]);

	expect(evidence.totals).toEqual({
		attempts: 4,
		passes: 3,
		calls: 4,
		rightCalls: 4,
	});
	expect(evidence.started.map((entry) => entry.concept)).toEqual(["joins"]);
	expect(evidence.notStarted.map((entry) => entry.concept)).toEqual([
		"filtering",
	]);
});

test("uses optimization as the initial view only when it has more evidence", () => {
	expect(
		initialSkillLandscapeView([
			row("joins", 1, 1),
			row("optimization-index-access", 2, 1),
		]),
	).toBe("optimization");
	expect(initialSkillLandscapeView([row("joins", 1, 1)])).toBe("learn");
});

test("resolves topic titles and summarizes the learner model for Sarjy", () => {
	expect(resolveProfileConcept("Joins")).toBe("joins");
	const evidence = buildProfileEvidenceModel([row("joins", 2, 1)]);
	const summary = profileScreenSummary({
		evidence,
		memories: [],
		radarView: "learn",
		comparison: undefined,
		focusedConcept: "joins",
	});
	expect(summary).toContain("2 independent exercise episodes");
	expect(summary).toContain("Spotlight: joins");
});

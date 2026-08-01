import { expect, test } from "bun:test";

import type { ConceptProfileView } from "@/components/practice/concept-card";

import { buildSkillLandscapeModel } from "./skill-landscape-model";

const profiles = [
	{
		concept: "joins",
		current: 1.4,
		opportunities: 2,
		passes: 2,
	},
	{
		concept: "optimization-index-access",
		current: 0.5,
		opportunities: 1,
		passes: 0,
	},
] as ConceptProfileView[];

test("builds a bounded radar model for one selected topic family", () => {
	const model = buildSkillLandscapeModel({
		profiles,
		history: [
			{
				id: "earlier",
				sessionNumber: 1,
				endedAt: "2026-07-31T10:00:00Z",
				attempts: 1,
				totalAttempts: 1,
				profiles: [
					{ concept: "joins", current: 0.25, opportunities: 1, passes: 0 },
				],
			},
		],
		view: "learn",
		comparisonId: "earlier",
		focusedConcept: "joins",
		titleFor: (concept) => concept,
	});

	expect(model.rows.map((row) => row.concept)).toEqual(["joins"]);
	expect(model.chartRows[0]?.strength).toBe(100);
	expect(model.changed).toEqual({ grew: 1, cooled: 0 });
	expect(model.focused?.concept).toBe("joins");
	expect(model.totalAttempts).toBe(3);
});

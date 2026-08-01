import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ConceptProfileView } from "./concept-card";
import { SkillLandscape } from "./skill-landscape";

const profiles: ConceptProfileView[] = [
	{
		concept: "joins",
		current: 0.75,
		opportunities: 4,
		passes: 3,
		trajectory: "converging",
		mistakes: [],
		lastSeenAt: new Date("2026-08-01T10:00:00Z"),
		everMastered: false,
		unassistedPasses: 3,
		assistedPasses: 0,
		explanation: "correct",
	},
	{
		concept: "optimization-index-access",
		current: 0.5,
		opportunities: 2,
		passes: 1,
		trajectory: "mixed",
		mistakes: [],
		lastSeenAt: new Date("2026-08-01T10:00:00Z"),
		everMastered: false,
		unassistedPasses: 1,
		assistedPasses: 0,
		explanation: null,
	},
];

test("renders a real then-vs-now comparison and topic spotlight", () => {
	const html = renderToStaticMarkup(
		<SkillLandscape
			profiles={profiles}
			history={[
				{
					id: "session-1",
					sessionNumber: 1,
					endedAt: "2026-07-31T10:00:00Z",
					attempts: 2,
					totalAttempts: 2,
					profiles: [
						{
							concept: "joins",
							current: 0.25,
							opportunities: 2,
							passes: 1,
						},
					],
				},
			]}
			historyPending={false}
			historyError={false}
			view="learn"
			onViewChange={() => {}}
			comparisonId="session-1"
			onComparisonChange={() => {}}
			focusedConcept="joins"
			focusNote="This is the biggest gain."
			titleFor={(concept) => concept}
		/>,
	);

	expect(html).toContain("Compare now with");
	expect(html).toContain('data-chart-engine="tanstack-charts"');
	expect(html).toContain('stroke-dasharray="5 5"');
	expect(html).toContain("exercise episodes");
	expect(html).toContain("1 grew · 0 cooled");
	expect(html).toContain("Spotlight: joins");
	expect(html).toContain("This is the biggest gain.");
});

test("does not imply progress when there is only one session", () => {
	const html = renderToStaticMarkup(
		<SkillLandscape
			profiles={profiles}
			history={[]}
			historyPending={false}
			historyError={false}
			view="learn"
			onViewChange={() => {}}
			comparisonId={null}
			onComparisonChange={() => {}}
			focusedConcept={null}
			focusNote={null}
			titleFor={(concept) => concept}
		/>,
	);

	expect(html).toContain("One more session makes this move.");
	expect(html).toContain('data-chart-engine="tanstack-charts"');
	expect(html).not.toContain("Then · session");
});

import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/features/landing/landing-page";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{
				title: "Sarjy | The SQL teacher that learns how you learn",
			},
			{
				name: "description",
				content:
					"Learn SQL through three adaptive questions at a time, voice-guided visual walkthroughs, real-world weather data missions, measured query-optimization labs, and a learner profile that shows how your evidence changes across sessions.",
			},
		],
	}),
	component: LandingPage,
});

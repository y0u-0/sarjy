import { createFileRoute } from "@tanstack/react-router";

import { InteractiveCaseStudy } from "@/components/slides/interactive-case-study";

export const Route = createFileRoute("/slides")({
	head: () => ({
		meta: [
			{
				title: "Sarjy | The system adapts to the student",
			},
			{
				name: "description",
				content: "An interactive story about Sarjy, the adaptive SQL teacher.",
			},
		],
	}),
	component: InteractiveCaseStudy,
});

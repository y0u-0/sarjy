import type { OptimizationLessonState } from "./lesson-session";

export interface OptimizationLessonPresentation {
	eyebrow: string;
	title: string;
	prompt: string;
	waiting: boolean;
}

const RESPONSES: Record<
	Exclude<OptimizationLessonState["awaitingResponse"], null>,
	OptimizationLessonPresentation
> = {
	interpretation: {
		eyebrow: "1 · Interpret",
		title: "What does this SQL return?",
		prompt:
			"Explain the result shape, filters, grouping, and ordering in your own words.",
		waiting: true,
	},
	guidance: {
		eyebrow: "2 · Choose your pace",
		title: "How should we work through it?",
		prompt: "Tell Sarjy: try first, guide me, or show me one step at a time.",
		waiting: true,
	},
	observation: {
		eyebrow: "3 · Observe",
		title: "Notice one expensive operation",
		prompt:
			"Answer Sarjy’s question about the one piece of evidence on screen. It will stay here until the idea is clear.",
		waiting: true,
	},
	"data-observation": {
		eyebrow: "4 · Follow the rows",
		title: "What does this operator do to the data?",
		prompt:
			"Follow the real fixture rows through the highlighted operation, then describe what gets read, kept, or discarded.",
		waiting: true,
	},
	prediction: {
		eyebrow: "5 · Predict",
		title: "Commit before measuring",
		prompt: "Say what work you expect the change to remove, then explain why.",
		waiting: true,
	},
	change: {
		eyebrow: "6 · Write",
		title: "Your turn to change the SQL",
		prompt:
			"Write one index or rewrite, then ask Sarjy to measure your exact SQL. Nothing runs until you submit it.",
		waiting: true,
	},
	correctness: {
		eyebrow: "7 · Verify",
		title: "Did the answer stay the same?",
		prompt:
			"Compare only the result rows first. Performance evidence stays hidden until correctness is settled.",
		waiting: true,
	},
	comparison: {
		eyebrow: "8 · Compare",
		title: "What work actually changed?",
		prompt:
			"Use the highlighted operator and measured counter. Name the work that disappeared or remained.",
		waiting: true,
	},
	"alternative-review": {
		eyebrow: "9 · Consider",
		title: "Would this alternative fit?",
		prompt:
			"Explain why this one alternative is better, worse, or situational for this exact query.",
		waiting: true,
	},
	teachback: {
		eyebrow: "10 · Teach back",
		title: "Explain the whole optimization",
		prompt:
			"Connect the SQL or schema change to the plan evidence and the measured work in your own words.",
		waiting: true,
	},
};

export function lessonPresentation(
	state: OptimizationLessonState,
): OptimizationLessonPresentation {
	if (state.awaitingResponse) return RESPONSES[state.awaitingResponse];
	if (state.checkpoint === "alternatives") {
		return {
			eyebrow: "9 · Consider",
			title: "One alternative is next",
			prompt:
				"Sarjy will reveal one relevant approach, then stop for your answer.",
			waiting: false,
		};
	}
	if (state.checkpoint === "complete") {
		return {
			eyebrow: "Complete",
			title: "You can explain the trade-off",
			prompt: "Continue, retry with another change, or ask Sarjy to move on.",
			waiting: false,
		};
	}
	return {
		eyebrow: "Live lesson",
		title: "Stay with this step",
		prompt: "Sarjy will reveal the next piece only after you are aligned.",
		waiting: false,
	};
}

import type { OptimizationTimelineStep } from "@/lib/optimize/timeline";

/**
 * The editor stays persistent while one agent-controlled canvas morphs between
 * teaching surfaces. The learner never manages panels or playback controls.
 */
export const LAB_SURFACES = [
	"workspace",
	"prediction",
	"plan",
	"animation",
	"comparison",
] as const;

export type LabSurface = (typeof LAB_SURFACES)[number];

export const LAB_SURFACE_LABELS: Record<LabSurface, string> = {
	workspace: "writing workspace",
	prediction: "prediction",
	plan: "query plan",
	animation: "data-flow animation",
	comparison: "before-and-after evidence",
};

export function isLabSurface(value: string): value is LabSurface {
	return LAB_SURFACES.some((surface) => surface === value);
}

export function surfaceForTimelineStep(
	step: OptimizationTimelineStep | undefined,
): LabSurface {
	if (!step) return "workspace";
	if (step.id === "predict") return "prediction";

	switch (step.layer) {
		case "plan":
			return "plan";
		case "rows":
			return "animation";
		case "compare":
		case "reflect":
			return "comparison";
		case "query":
		case "change":
			return "workspace";
	}
}

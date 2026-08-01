import type { LabController } from "@/lib/optimize/lab-controller";

import { useOptimizationTeacherController } from "./optimization-teacher-bridge";

type ActionGroups = {
	problem: Pick<LabController, "selectProblem">;
	checkpoints: Pick<
		LabController,
		| "recordInterpretation"
		| "chooseGuidance"
		| "recordObservation"
		| "recordDataObservation"
		| "recordPrediction"
		| "recordCorrectness"
		| "recordComparison"
		| "recordAlternativeReview"
	>;
	canvas: Pick<
		LabController,
		| "describeSurface"
		| "setSurface"
		| "explain"
		| "focusPlanNode"
		| "replayAnimation"
	>;
	changes: Pick<LabController, "applyIndex" | "applyRewrite">;
	review: Pick<
		LabController,
		"reviewAlternatives" | "resetIndexes" | "askPredict" | "recordExplanation"
	>;
	timeline: Pick<
		LabController,
		| "timelineStepTo"
		| "timelineNext"
		| "timelinePrevious"
		| "timelinePlay"
		| "timelinePause"
		| "timelineRestart"
		| "timelineSetSpeed"
		| "timelineSpeechStarted"
		| "timelineSpeechEnded"
		| "timelineDescribe"
	>;
};

export function useOptimizationLabController(groups: ActionGroups) {
	const controller: LabController = {
		...groups.problem,
		...groups.checkpoints,
		...groups.canvas,
		...groups.changes,
		...groups.review,
		...groups.timeline,
	};
	useOptimizationTeacherController(controller);
}

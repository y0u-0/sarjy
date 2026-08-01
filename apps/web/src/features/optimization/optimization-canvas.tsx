import type { OptimizationLabProblem } from "@/lib/curriculum/optimization-bank";
import type { OptimizationLessonPresentation } from "@/lib/optimize/lesson-presentation";
import type {
	OptimizationLessonState,
	OptimizationResponseGate,
} from "@/lib/optimize/lesson-session";
import type { OptimizationOutcome } from "@/lib/optimize/success";
import type { LabSurface } from "@/lib/optimize/surface";
import type {
	OptimizationTimelineStep,
	TimelineVisualPlayback,
} from "@/lib/optimize/timeline";
import type { PlanDiff } from "@/lib/sql-engine/types";

import { OptimizationCanvasHeader } from "./optimization-canvas-header";
import {
	BaselineLoadingSurface,
	PredictionSurface,
	WorkspaceSurface,
} from "./optimization-canvas-workspace";
import {
	ComparisonSurface,
	PlanAndRowsSurface,
} from "./optimization-evidence-surface";
import type { Measurement, VoicePrediction } from "./optimization-model";

export interface OptimizationCanvasProps {
	lessonPresentation: OptimizationLessonPresentation;
	responseGate: OptimizationResponseGate | null;
	lessonCheckpoint: OptimizationLessonState["checkpoint"];
	surface: LabSurface;
	activeStep: OptimizationTimelineStep | undefined;
	guidedNote: string | null;
	busy: boolean;
	prediction: VoicePrediction | null;
	problem: OptimizationLabProblem;
	baseline: Measurement | null;
	candidate: Measurement | null;
	visibleMeasurement: Measurement | null;
	visibleDiff: PlanDiff | null;
	focusedId: number | null;
	focusNote: string | null;
	replayKey: number;
	operatorPlayback: TimelineVisualPlayback;
	alternativesVisible: boolean;
	outcome: OptimizationOutcome | null;
}

export function OptimizationCanvas(props: OptimizationCanvasProps) {
	return (
		<section
			data-lab-surface={props.surface}
			aria-label="Agent-controlled optimization teaching canvas"
			aria-live="polite"
			className="scroll-mt-5 overflow-hidden rounded-3xl border border-border bg-ink-soft"
		>
			<OptimizationCanvasHeader presentation={props.lessonPresentation} />
			<div
				key={`${props.surface}-${props.activeStep?.id ?? "loading"}-${props.focusedId ?? "none"}`}
				className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 p-4 motion-safe:animate-in motion-safe:duration-200 sm:p-5"
			>
				<ActiveOptimizationSurface {...props} />
			</div>
		</section>
	);
}

function ActiveOptimizationSurface(props: OptimizationCanvasProps) {
	if (props.busy && !props.baseline) return <BaselineLoadingSurface />;
	if (props.surface === "prediction" && props.prediction) {
		return <PredictionSurface prediction={props.prediction} />;
	}
	if (props.surface === "plan" || props.surface === "animation") {
		return <PlanAndRowsSurface {...props} />;
	}
	if (props.surface === "comparison") return <ComparisonSurface {...props} />;
	return <WorkspaceSurface problem={props.problem} />;
}

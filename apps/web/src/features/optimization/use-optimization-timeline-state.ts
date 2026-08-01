import { useEffect, useMemo, useRef } from "react";
import {
	buildOptimizationTimeline,
	type OptimizationTimelineStep,
} from "@/lib/optimize/timeline";

import type { OptimizationState } from "./use-optimization-state";

export function useOptimizationTimelineState(
	state: OptimizationState,
	reducedMotion: boolean,
) {
	const timeline = useMemo(
		() =>
			buildOptimizationTimeline({
				problem: state.problem,
				baseline: state.baseline,
				candidate: state.candidate,
				diff: state.diff,
				changeApplied:
					state.problem.mode === "index"
						? state.indexes.length > 0
						: state.comparison !== null,
			}),
		[
			state.problem,
			state.baseline,
			state.candidate,
			state.diff,
			state.indexes.length,
			state.comparison,
		],
	);
	const timelineRef = useRef(timeline);
	timelineRef.current = timeline;
	const cursorRef = useRef(state.timelineCursor);
	cursorRef.current = state.timelineCursor;
	const narrationPlaybackArmed = useRef(false);
	const activeStep = timeline[
		Math.min(state.timelineCursor, Math.max(0, timeline.length - 1))
	] as OptimizationTimelineStep | undefined;

	useEffect(() => {
		state.setTimelineCursor((cursor) =>
			Math.min(cursor, Math.max(0, timeline.length - 1)),
		);
	}, [state.setTimelineCursor, timeline.length]);

	useEffect(() => {
		if (reducedMotion) {
			state.setTimelinePlaying(false);
			narrationPlaybackArmed.current = false;
			state.setVisualPlayback("complete");
			return;
		}
		if (activeStep?.layer === "rows") {
			state.setReplayKey((key) => key + 1);
			state.setVisualPlayback("playing");
			return;
		}
		const rowStep = timeline.findIndex((step) => step.layer === "rows");
		state.setVisualPlayback(
			rowStep >= 0 && state.timelineCursor > rowStep ? "complete" : "idle",
		);
	}, [
		activeStep?.layer,
		reducedMotion,
		state.setReplayKey,
		state.setTimelinePlaying,
		state.setVisualPlayback,
		state.timelineCursor,
		timeline,
	]);

	return {
		timeline,
		timelineRef,
		cursorRef,
		narrationPlaybackArmed,
		activeStep,
	};
}

export type OptimizationTimelineState = ReturnType<
	typeof useOptimizationTimelineState
>;

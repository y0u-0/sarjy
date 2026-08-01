import { useCallback } from "react";

import { blockLab } from "@/lib/optimize/lab-controller";
import { surfaceForTimelineStep } from "@/lib/optimize/surface";

import type { OptimizationSession } from "./optimization-session";
import type { OptimizationState } from "./use-optimization-state";
import type { OptimizationTimelineState } from "./use-optimization-timeline-state";

interface TimelineActionOptions {
	state: OptimizationState;
	timeline: OptimizationTimelineState;
	session: OptimizationSession;
	reducedMotion: boolean;
	isSpeaking: boolean;
	revealSurface: (
		surface: ReturnType<typeof surfaceForTimelineStep>,
		note?: string | null,
	) => void;
}

export function useOptimizationTimelineActions(options: TimelineActionOptions) {
	const { state, timeline, session, reducedMotion, isSpeaking, revealSurface } =
		options;
	const startPlayback = useCallback(() => {
		const step = timeline.timelineRef.current[timeline.cursorRef.current];
		revealSurface(surfaceForTimelineStep(step), step?.description ?? null);
		if (reducedMotion) {
			state.setTimelinePlaying(false);
			state.setVisualPlayback("complete");
			return false;
		}
		state.setTimelinePlaying(true);
		if (step?.layer === "rows") state.setVisualPlayback("playing");
		return true;
	}, [reducedMotion, revealSurface, state, timeline]);

	const stepTo = useCallback(
		(index: number) => {
			const steps = timeline.timelineRef.current;
			const rounded = Math.round(index);
			if (rounded < 0 || rounded >= steps.length) {
				return blockLab(
					`Step ${index} is out of range. Use 0 through ${Math.max(0, steps.length - 1)}.`,
				);
			}
			const step = steps[rounded];
			const surface = surfaceForTimelineStep(step);
			if (
				(surface === "plan" || surface === "animation") &&
				session.read().checkpoint !== "observe"
			) {
				return blockLab(
					"That evidence belongs to observation. Stay on the learner's current checkpoint.",
				);
			}
			if (surface === "plan" && !session.read().planRevealed) {
				const lesson = session.dispatch({ type: "reveal-plan" });
				if (!lesson.accepted) return blockLab(lesson.message);
			}
			if (surface === "animation" && !session.read().dataRevealed) {
				const lesson = session.dispatch({ type: "reveal-data" });
				if (!lesson.accepted) return blockLab(lesson.message);
			}
			if (surface === "comparison" && !session.read().changeApplied) {
				return blockLab(
					"Measure the learner's change before showing comparison.",
				);
			}
			timeline.narrationPlaybackArmed.current = false;
			state.setTimelinePlaying(false);
			state.setFocus(null);
			state.setTimelineCursor(rounded);
			revealSurface(surface, step?.description ?? null);
			if (step?.layer === "rows") {
				state.setReplayKey((key) => key + 1);
				state.setVisualPlayback(reducedMotion ? "complete" : "playing");
			}
			return step
				? `Showing step ${rounded}: ${step.title}. ${step.description}`
				: "That step is unavailable.";
		},
		[reducedMotion, revealSurface, session, state, timeline],
	);

	const play = useCallback(() => {
		if (reducedMotion) {
			return "Reduced motion is on. Use next and previous for discrete steps.";
		}
		timeline.narrationPlaybackArmed.current = true;
		if (isSpeaking) startPlayback();
		return isSpeaking
			? "Animating only the current lesson step with the narration."
			: "The current step is armed; its animation will start with the spoken response and will not advance the lesson.";
	}, [isSpeaking, reducedMotion, startPlayback, timeline]);

	const pause = useCallback(() => {
		timeline.narrationPlaybackArmed.current = false;
		state.setTimelinePlaying(false);
		if (
			timeline.timelineRef.current[timeline.cursorRef.current]?.layer === "rows"
		) {
			state.setVisualPlayback(reducedMotion ? "complete" : "paused");
		}
		return "Paused the current step. The lesson did not advance.";
	}, [reducedMotion, state, timeline]);

	const restart = useCallback(() => {
		timeline.narrationPlaybackArmed.current = false;
		state.setTimelinePlaying(false);
		state.setFocus(null);
		state.setTimelineCursor(0);
		state.setReplayKey((key) => key + 1);
		state.setVisualPlayback(reducedMotion ? "complete" : "idle");
		revealSurface("workspace");
		return "Restarted the walkthrough at step 0.";
	}, [reducedMotion, revealSurface, state, timeline]);

	const setSpeed = useCallback(
		(speed: number) => {
			if (reducedMotion)
				return "Reduced motion is on, so playback speed is unavailable.";
			if (speed !== 0.75 && speed !== 1 && speed !== 1.5) {
				return "Unsupported speed. Use exactly 0.75, 1, or 1.5.";
			}
			state.setTimelineSpeed(speed);
			return `Walkthrough speed set to ${speed}x.`;
		},
		[reducedMotion, state.setTimelineSpeed],
	);

	return {
		stepTo,
		next: () =>
			stepTo(
				Math.min(
					timeline.cursorRef.current + 1,
					timeline.timelineRef.current.length - 1,
				),
			),
		previous: () => stepTo(Math.max(0, timeline.cursorRef.current - 1)),
		play,
		pause,
		restart,
		setSpeed,
		speechStarted: () => {
			if (timeline.narrationPlaybackArmed.current) startPlayback();
		},
		speechEnded: () => {
			if (!timeline.narrationPlaybackArmed.current) return;
			timeline.narrationPlaybackArmed.current = false;
			state.setTimelinePlaying(false);
			if (
				timeline.timelineRef.current[timeline.cursorRef.current]?.layer ===
				"rows"
			) {
				state.setVisualPlayback(reducedMotion ? "complete" : "paused");
			}
		},
		describe: () => {
			const step = timeline.timelineRef.current[timeline.cursorRef.current];
			return step
				? `Active step ${timeline.cursorRef.current} of ${timeline.timelineRef.current.length - 1}: ${step.title}. ${step.description}${step.metric ? ` Metric: ${step.metric}.` : ""}`
				: "No walkthrough step is available yet.";
		},
	};
}

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { TimelineVisualPlayback } from "@/lib/optimize/timeline";

export function usePipelineReveal(
	stageCount: number,
	replayKey: number,
	playback: TimelineVisualPlayback,
) {
	const reducedMotion = useReducedMotion();
	const [revealed, setRevealed] = useState(0);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		void replayKey;
		setRevealed(reducedMotion ? stageCount : 0);
	}, [replayKey, stageCount, reducedMotion]);

	useEffect(() => {
		if (timer.current !== null) clearTimeout(timer.current);
		timer.current = null;
		if (reducedMotion || playback === "complete") {
			setRevealed(stageCount);
			return;
		}
		if (playback === "idle") {
			setRevealed(0);
			return;
		}
		if (playback === "paused" || revealed >= stageCount) return;
		timer.current = setTimeout(
			() => setRevealed((count) => Math.min(count + 1, stageCount)),
			revealed === 0 ? 120 : 300,
		);
		return () => {
			if (timer.current !== null) clearTimeout(timer.current);
		};
	}, [playback, reducedMotion, revealed, stageCount]);

	return revealed;
}

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

import {
	SARJY_MOUTH_JITTER,
	SARJY_MOUTH_REST_PX,
	type SarjyState,
	shouldRunSarjyVolumeAnimation,
} from "./sarjy-orb-animation";

function useOrbVisibility() {
	const rootRef = useRef<HTMLDivElement>(null);
	const [intersecting, setIntersecting] = useState(false);
	const [documentVisible, setDocumentVisible] = useState(false);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		const updateVisibility = () => {
			setDocumentVisible(document.visibilityState === "visible");
		};
		updateVisibility();
		document.addEventListener("visibilitychange", updateVisibility);

		if (!("IntersectionObserver" in window)) {
			setIntersecting(true);
			return () =>
				document.removeEventListener("visibilitychange", updateVisibility);
		}

		const observer = new IntersectionObserver(([entry]) => {
			setIntersecting(entry?.isIntersecting === true);
		});
		observer.observe(root);
		return () => {
			document.removeEventListener("visibilitychange", updateVisibility);
			observer.disconnect();
		};
	}, []);

	return { documentVisible, intersecting, rootRef };
}

export function useSarjyOrbAnimation({
	state,
	getInputVolume,
	getOutputVolume,
}: {
	state: SarjyState;
	getInputVolume: () => number;
	getOutputVolume: () => number;
}) {
	const mouthRefs = useRef<(HTMLSpanElement | null)[]>([]);
	const micRingRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useReducedMotion();
	const { documentVisible, intersecting, rootRef } = useOrbVisibility();

	useEffect(() => {
		const reset = () => {
			for (const bar of mouthRefs.current) {
				if (bar) bar.style.height = `${SARJY_MOUTH_REST_PX}px`;
			}
			if (micRingRef.current) {
				micRingRef.current.style.transform = "scale(1)";
				micRingRef.current.style.opacity = "0";
			}
		};
		if (
			!shouldRunSarjyVolumeAnimation(state, {
				documentVisible,
				intersecting,
				reducedMotion,
			}) ||
			typeof requestAnimationFrame !== "function"
		) {
			reset();
			return;
		}

		let frame = 0;
		const tick = () => {
			const output = state === "talking" ? getOutputVolume() : 0;
			mouthRefs.current.forEach((bar, index) => {
				if (!bar) return;
				const height =
					state === "talking"
						? SARJY_MOUTH_REST_PX +
							Math.min(output * 30 * SARJY_MOUTH_JITTER[index], 19)
						: SARJY_MOUTH_REST_PX;
				bar.style.height = `${height}px`;
			});
			if (micRingRef.current) {
				const input = getInputVolume();
				micRingRef.current.style.transform = `scale(${1 + Math.min(input * 0.4, 0.4)})`;
				micRingRef.current.style.opacity = input > 0.05 ? "1" : "0";
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(frame);
			reset();
		};
	}, [
		documentVisible,
		getInputVolume,
		getOutputVolume,
		intersecting,
		reducedMotion,
		state,
	]);

	return { micRingRef, mouthRefs, rootRef };
}

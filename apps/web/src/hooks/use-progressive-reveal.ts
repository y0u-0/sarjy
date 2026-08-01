import { useEffect, useRef, useState } from "react";

function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(query.matches);
		const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);
	return reduced;
}

export function useProgressiveReveal(itemCount: number, replayKey: number) {
	const reducedMotion = useReducedMotion();
	const [revealed, setRevealed] = useState(0);
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

	useEffect(() => {
		void replayKey;
		for (const timer of timers.current) clearTimeout(timer);
		timers.current = [];
		if (reducedMotion) {
			setRevealed(itemCount);
			return;
		}
		setRevealed(0);
		const step = itemCount > 20 ? 45 : 90;
		for (let index = 0; index < itemCount; index++) {
			timers.current.push(
				setTimeout(() => setRevealed(index + 1), 80 + index * step),
			);
		}
		return () => {
			for (const timer of timers.current) clearTimeout(timer);
		};
	}, [itemCount, reducedMotion, replayKey]);

	return revealed;
}

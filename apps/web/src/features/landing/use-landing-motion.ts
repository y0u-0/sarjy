import { useEffect, useRef } from "react";

export function useLandingMotion() {
	const rootRef = useRef<HTMLDivElement>(null);
	const heroTiltRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reducedMotion) return;

		const revealItems = Array.from(
			root.querySelectorAll<HTMLElement>("[data-landing-reveal]"),
		);
		for (const item of revealItems) {
			const bounds = item.getBoundingClientRect();
			if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
				item.dataset.landingVisible = "true";
			}
		}
		root.classList.add("landing-motion-ready");

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					(entry.target as HTMLElement).dataset.landingVisible = "true";
					observer.unobserve(entry.target);
				}
			},
			{ root, rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
		);
		for (const item of revealItems) {
			if (!item.dataset.landingVisible) observer.observe(item);
		}

		const heroTilt = heroTiltRef.current;
		const finePointer = window.matchMedia(
			"(hover: hover) and (pointer: fine)",
		).matches;
		if (!(heroTilt && finePointer)) {
			return () => observer.disconnect();
		}

		let frame = 0;
		let currentX = 0;
		let currentY = 0;
		let targetX = 0;
		let targetY = 0;

		const renderTilt = () => {
			currentX += (targetX - currentX) * 0.12;
			currentY += (targetY - currentY) * 0.12;
			heroTilt.style.transform = `perspective(1200px) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;

			if (
				Math.abs(targetX - currentX) > 0.01 ||
				Math.abs(targetY - currentY) > 0.01
			) {
				frame = window.requestAnimationFrame(renderTilt);
			} else {
				frame = 0;
			}
		};

		const scheduleTilt = () => {
			if (!frame) frame = window.requestAnimationFrame(renderTilt);
		};

		const handlePointerMove = (event: PointerEvent) => {
			const bounds = heroTilt.getBoundingClientRect();
			const x = (event.clientX - bounds.left) / bounds.width - 0.5;
			const y = (event.clientY - bounds.top) / bounds.height - 0.5;
			targetX = y * -2.2;
			targetY = x * 2.8;
			scheduleTilt();
		};

		const resetTilt = () => {
			targetX = 0;
			targetY = 0;
			scheduleTilt();
		};

		heroTilt.addEventListener("pointermove", handlePointerMove);
		heroTilt.addEventListener("pointerleave", resetTilt);

		return () => {
			observer.disconnect();
			heroTilt.removeEventListener("pointermove", handlePointerMove);
			heroTilt.removeEventListener("pointerleave", resetTilt);
			window.cancelAnimationFrame(frame);
			heroTilt.style.removeProperty("transform");
		};
	}, []);

	return { heroTiltRef, rootRef };
}

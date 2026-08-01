import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { readSlideHash, SLIDE_COUNT } from "./deck-primitives";
import { deckStyles } from "./deck-styles";
import { slides } from "./slide-registry";

export function InteractiveCaseStudy() {
	const initialSlide = useMemo(() => {
		if (typeof window === "undefined") return 0;
		return readSlideHash(window.location.hash);
	}, []);
	const [slideIndex, setSlideIndex] = useState(initialSlide);

	const goTo = useCallback((nextIndex: number) => {
		const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, nextIndex));
		setSlideIndex(clamped);
		if (typeof window !== "undefined") {
			window.history.replaceState(null, "", `#${clamped + 1}`);
		}
	}, []);

	const previous = useCallback(() => goTo(slideIndex - 1), [goTo, slideIndex]);
	const next = useCallback(() => goTo(slideIndex + 1), [goTo, slideIndex]);

	useEffect(() => {
		const syncFromHash = () =>
			setSlideIndex(readSlideHash(window.location.hash));
		window.addEventListener("hashchange", syncFromHash);
		return () => window.removeEventListener("hashchange", syncFromHash);
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (event.key === " " && target?.closest("button")) return;

			if (
				event.key === "ArrowRight" ||
				event.key === " " ||
				event.key === "PageDown"
			) {
				event.preventDefault();
				next();
				return;
			}
			if (event.key === "ArrowLeft" || event.key === "PageUp") {
				event.preventDefault();
				previous();
				return;
			}
			if (event.key === "Home") goTo(0);
			if (event.key === "End") goTo(SLIDE_COUNT - 1);
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [goTo, next, previous]);

	return (
		<main
			className="flex h-dvh w-screen select-none items-center justify-center overflow-hidden bg-black"
			aria-label="Sarjy interactive story"
		>
			<style>{deckStyles}</style>
			<div
				className="relative aspect-video w-full max-w-[177.778dvh] overflow-hidden"
				style={{ containerType: "inline-size" }}
			>
				<div
					key={slideIndex}
					className="case-slide-enter size-full"
					aria-live="polite"
				>
					{slides[slideIndex]}
				</div>

				<div className="pointer-events-none absolute top-0 right-0 left-0 z-50 h-[0.28cqi] bg-black/10">
					<div
						className="h-full origin-left bg-tangerine transition-transform duration-300 ease-out motion-reduce:transition-none"
						style={{
							transform: `scaleX(${(slideIndex + 1) / SLIDE_COUNT})`,
						}}
					/>
				</div>

				<nav
					className="absolute right-[2.5cqi] bottom-[1.8cqi] z-50 flex items-center gap-[0.7cqi]"
					aria-label="Slide controls"
				>
					<button
						type="button"
						onClick={previous}
						disabled={slideIndex === 0}
						className="case-nav-button"
						aria-label="Previous slide"
					>
						<ArrowLeft aria-hidden />
					</button>
					<button
						type="button"
						onClick={next}
						disabled={slideIndex === SLIDE_COUNT - 1}
						className="case-nav-button"
						aria-label="Next slide"
					>
						<ArrowRight aria-hidden />
					</button>
				</nav>

				<div className="absolute bottom-[2.35cqi] left-1/2 z-50 flex -translate-x-1/2 gap-[0.55cqi]">
					{Array.from({ length: SLIDE_COUNT }, (_, index) => (
						<button
							key={index}
							type="button"
							onClick={() => goTo(index)}
							className={`h-[0.3cqi] rounded-full transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none ${
								index === slideIndex
									? "w-[2.2cqi] bg-tangerine"
									: "w-[0.55cqi] bg-current opacity-25"
							}`}
							aria-label={`Go to slide ${index + 1}`}
							aria-current={index === slideIndex ? "page" : undefined}
						/>
					))}
				</div>
			</div>
		</main>
	);
}

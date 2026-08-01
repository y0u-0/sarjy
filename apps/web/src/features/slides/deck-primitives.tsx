import { Pause, Play } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const SLIDE_COUNT = 8;

export const INPUT_VOLUME = () =>
	0.08 + Math.abs(Math.sin(performance.now() / 580)) * 0.2;

export const OUTPUT_VOLUME = () =>
	0.12 +
	Math.abs(Math.sin(performance.now() / 115)) * 0.22 +
	Math.abs(Math.sin(performance.now() / 71)) * 0.08;

type Tone = "cream" | "ink" | "lime";

export interface SequenceControls {
	step: number;
	setStep: (step: number) => void;
	paused: boolean;
	setPaused: (paused: boolean) => void;
}

export function readSlideHash(hash: string) {
	const parsed = Number.parseInt(hash.replace("#", ""), 10);
	if (!Number.isFinite(parsed)) return 0;
	return Math.max(0, Math.min(SLIDE_COUNT - 1, parsed - 1));
}

export function useSequence(count: number, delay: number): SequenceControls {
	const reducedMotion = useReducedMotion();
	const [step, setStepState] = useState(0);
	const [paused, setPaused] = useState(false);

	// Reset the autoplay clock after a presenter manually changes the beat.
	// biome-ignore lint/correctness/useExhaustiveDependencies: step intentionally restarts the timer.
	useEffect(() => {
		if (paused || reducedMotion) return;
		const timer = window.setTimeout(() => {
			setStepState((current) => (current + 1) % count);
		}, delay);
		return () => window.clearTimeout(timer);
	}, [count, delay, paused, reducedMotion, step]);

	const setStep = useCallback(
		(nextStep: number) => {
			setPaused(true);
			setStepState(Math.max(0, Math.min(count - 1, nextStep)));
		},
		[count],
	);

	return { step, setStep, paused, setPaused };
}

export function Slide({
	children,
	index,
	label,
	tone = "cream",
}: {
	children: ReactNode;
	index: number;
	label: string;
	tone?: Tone;
}) {
	const toneClass =
		tone === "ink"
			? "bg-ink text-cream"
			: tone === "lime"
				? "bg-lime text-ink"
				: "bg-cream text-ink";

	return (
		<section
			className={`relative size-full overflow-hidden ${toneClass}`}
			aria-label={`Slide ${index} of ${SLIDE_COUNT}: ${label}`}
		>
			{children}
		</section>
	);
}

export function SequenceTabs({
	labels,
	controls,
}: {
	labels: string[];
	controls: SequenceControls;
}) {
	return (
		<fieldset
			className="flex items-center gap-[0.55cqi]"
			aria-label="Animation controls"
		>
			{labels.map((label, index) => (
				<button
					key={label}
					type="button"
					onClick={() => controls.setStep(index)}
					className={`case-sequence-tab ${index === controls.step ? "is-active" : ""}`}
					aria-pressed={index === controls.step}
				>
					<span>{String(index + 1).padStart(2, "0")}</span>
					{label}
				</button>
			))}
			<button
				type="button"
				onClick={() => controls.setPaused(!controls.paused)}
				className="case-icon-button"
				aria-label={controls.paused ? "Play animation" : "Pause animation"}
			>
				{controls.paused ? <Play aria-hidden /> : <Pause aria-hidden />}
			</button>
		</fieldset>
	);
}

import { type ReactNode, useEffect, useState } from "react";

import type { SarjyState } from "@/components/teacher/sarjy-orb";

export const ORB_INPUT = () => {
	const time = performance.now();
	return 0.08 + Math.abs(Math.sin(time / 540)) * 0.22;
};

export const ORB_OUTPUT = () => {
	const time = performance.now();
	return (
		0.16 +
		Math.abs(Math.sin(time / 118)) * 0.24 +
		Math.abs(Math.sin(time / 73)) * 0.12
	);
};

const LANDING_TEACHER_BEATS = [
	{
		state: "listening",
		status: "listening",
		line: "What do you expect this join to return?",
		detail: "your prediction becomes part of the lesson",
		duration: 2400,
	},
	{
		state: "thinking",
		status: "thinking",
		line: "The rows multiplied right after your JOIN.",
		detail: "connecting the result to how you reasoned",
		duration: 1900,
	},
	{
		state: "talking",
		status: "speaking",
		line: "Let us make the join visible, then you can retry.",
		detail: "visual first because that works for you",
		duration: 3200,
	},
] as const satisfies ReadonlyArray<{
	state: Exclude<SarjyState, null>;
	status: string;
	line: string;
	detail: string;
	duration: number;
}>;

export function TinyLabel({ children }: { children: ReactNode }) {
	return (
		<p className="font-bold font-mono text-[10px] uppercase tracking-[0.14em]">
			{children}
		</p>
	);
}

export function useLandingTeacherBeat() {
	const [beatIndex, setBeatIndex] = useState(0);

	useEffect(() => {
		const beat = LANDING_TEACHER_BEATS[beatIndex];
		const timer = window.setTimeout(() => {
			setBeatIndex((current) => (current + 1) % LANDING_TEACHER_BEATS.length);
		}, beat.duration);

		return () => window.clearTimeout(timer);
	}, [beatIndex]);

	return LANDING_TEACHER_BEATS[beatIndex];
}

import { Eye } from "lucide-react";

import { SarjyOrb, type SarjyState } from "@/components/teacher/sarjy-orb";

import { INPUT_VOLUME, OUTPUT_VOLUME, useSequence } from "../deck-primitives";

const TEACHING_BEATS = [
	{
		label: "Ask",
		state: "listening",
		line: "What do you expect this JOIN to return?",
		surface: "question",
	},
	{
		label: "See",
		state: "thinking",
		line: "Your rows multiplied after the JOIN.",
		surface: "query",
	},
	{
		label: "Show",
		state: "talking",
		line: "Let’s make the match visible.",
		surface: "plan",
	},
	{
		label: "Move",
		state: "talking",
		line: "Now try the same idea on new data.",
		surface: "next",
	},
] as const satisfies ReadonlyArray<{
	label: string;
	state: Exclude<SarjyState, null>;
	line: string;
	surface: "question" | "query" | "plan" | "next";
}>;

export function TeacherCanvasDemo() {
	const controls = useSequence(TEACHING_BEATS.length, 2200);
	const beat = TEACHING_BEATS[controls.step];

	return (
		<div className="absolute inset-x-[4cqi] top-[8.1cqi] bottom-[5.2cqi]">
			<div className="flex items-end justify-between">
				<h2 className="font-black text-[4.15cqi] leading-[0.92] tracking-[-0.06em]">
					The agent teaches
					<br />
					<span className="text-lime">on the screen.</span>
				</h2>
				<div className="flex items-center gap-[1cqi]">
					<div className="size-[5cqi]">
						<SarjyOrb
							state={beat.state}
							getInputVolume={INPUT_VOLUME}
							getOutputVolume={OUTPUT_VOLUME}
							className="size-full"
						/>
					</div>
					<div className="w-[24cqi]">
						<p className="font-mono text-[0.58cqi] text-cream/35 uppercase tracking-[0.14em]">
							Sarjy is {beat.state}
						</p>
						<p
							key={beat.line}
							className="case-value-enter mt-[0.45cqi] font-bold text-[1.05cqi]"
						>
							{beat.line}
						</p>
					</div>
				</div>
			</div>

			<div className="mt-[2.8cqi] grid h-[23cqi] grid-cols-[1fr_21cqi] overflow-hidden rounded-[1.2cqi] border border-cream/18 bg-[#1d1d1d]">
				<div className="relative border-cream/14 border-r p-[1.5cqi]">
					<div className="flex items-center justify-between font-mono text-[0.58cqi] text-cream/32 uppercase tracking-[0.13em]">
						<span>Live workspace</span>
						<span>{beat.surface}</span>
					</div>
					<pre className="mt-[2cqi] font-mono text-[1cqi] leading-[1.85]">
						<span className="text-periwinkle">SELECT</span> a.title, t.name
						{"\n"}
						<span className="text-periwinkle">FROM</span> albums a{"\n"}
						<span
							className={`${controls.step >= 1 ? "case-code-highlight" : ""}`}
						>
							<span className="text-periwinkle">JOIN</span> tracks t{" "}
							<span className="text-periwinkle">ON</span> a.id = t.album_id
						</span>
					</pre>
					{controls.step >= 2 && (
						<div className="case-plan-enter absolute right-[1.5cqi] bottom-[1.4cqi] left-[1.5cqi] flex items-center gap-[1cqi] rounded-[0.75cqi] border border-lime/35 bg-lime/8 px-[1cqi] py-[0.8cqi]">
							<Eye className="size-[1cqi] text-lime" />
							<span className="font-mono text-[0.7cqi]">
								albums → match album_id → tracks
							</span>
							<span className="ml-auto font-mono text-[0.62cqi] text-tangerine">
								6× rows
							</span>
						</div>
					)}
				</div>

				<div className="flex flex-col justify-between p-[1.4cqi]">
					<p className="font-mono text-[0.58cqi] text-cream/32 uppercase tracking-[0.13em]">
						Agent control
					</p>
					<div className="grid gap-[0.55cqi]">
						{TEACHING_BEATS.map((item, index) => (
							<button
								key={item.label}
								type="button"
								onClick={() => controls.setStep(index)}
								className={`case-agent-action ${index === controls.step ? "is-active" : ""}`}
							>
								<span>0{index + 1}</span>
								{item.label}
							</button>
						))}
					</div>
					<p className="text-[0.66cqi] text-cream/35">
						The learner only talks + writes.
					</p>
				</div>
			</div>
		</div>
	);
}

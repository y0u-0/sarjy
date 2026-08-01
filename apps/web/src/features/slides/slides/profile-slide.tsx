import { useState } from "react";

import { useSequence } from "../deck-primitives";

const PROFILE_SESSIONS = [
	{ label: "Session 1", values: [28, 44, 20, 32, 18, 24] },
	{ label: "Now", values: [72, 63, 42, 68, 36, 58] },
] as const;

const PROFILE_TOPICS = [
	"Select",
	"Filter",
	"Group",
	"Join",
	"Window",
	"Report",
] as const;

function radarPoints(values: readonly number[]) {
	const center = 50;
	const radius = 42;
	return values
		.map((value, index) => {
			const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
			const distance = radius * (value / 100);
			return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
		})
		.join(" ");
}

export function ProfileDemo() {
	const controls = useSequence(PROFILE_SESSIONS.length, 2800);
	const [focus, setFocus] = useState(3);
	const session = PROFILE_SESSIONS[controls.step];

	return (
		<div className="absolute inset-x-[4cqi] top-[8.2cqi] bottom-[5.2cqi]">
			<div className="flex items-end justify-between">
				<h2 className="font-black text-[4.15cqi] leading-[0.92] tracking-[-0.06em]">
					The learner model
					<br />
					<span className="text-lime">becomes tangible.</span>
				</h2>
				<div className="flex gap-[0.55cqi]">
					{PROFILE_SESSIONS.map((item, index) => (
						<button
							key={item.label}
							type="button"
							onClick={() => controls.setStep(index)}
							className={`case-choice ${controls.step === index ? "is-active" : ""}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			<div className="mt-[2cqi] grid grid-cols-[44cqi_1fr] items-center gap-[6cqi]">
				<div className="relative mx-auto size-[28cqi]">
					<svg
						viewBox="0 0 100 100"
						className="size-full overflow-visible"
						role="img"
						aria-label={`${session.label} SQL skill shape`}
					>
						{[20, 40].map((r) => (
							<polygon
								key={r}
								points={radarPoints(PROFILE_TOPICS.map(() => (r / 42) * 100))}
								fill="none"
								stroke="rgba(253,249,240,.16)"
								strokeWidth="0.5"
							/>
						))}
						{PROFILE_TOPICS.map((topic, index) => {
							const angle =
								(Math.PI * 2 * index) / PROFILE_TOPICS.length - Math.PI / 2;
							return (
								<line
									key={topic}
									x1="50"
									y1="50"
									x2={50 + Math.cos(angle) * 42}
									y2={50 + Math.sin(angle) * 42}
									stroke="rgba(253,249,240,.13)"
									strokeWidth="0.5"
								/>
							);
						})}
						<polygon
							key={session.label}
							points={radarPoints(session.values)}
							fill="rgba(122,120,255,.24)"
							stroke="#7a78ff"
							strokeWidth="1.2"
							className="case-radar-enter"
						/>
						{session.values.map((value, index) => {
							const angle =
								(Math.PI * 2 * index) / session.values.length - Math.PI / 2;
							const distance = 42 * (value / 100);
							return (
								<circle
									key={PROFILE_TOPICS[index]}
									cx={50 + Math.cos(angle) * distance}
									cy={50 + Math.sin(angle) * distance}
									r={index === focus ? 2.4 : 1.3}
									fill={index === focus ? "#ff6d38" : "#c7ff69"}
									stroke="#141414"
									strokeWidth="0.8"
								/>
							);
						})}
					</svg>
					{PROFILE_TOPICS.map((topic, index) => {
						const angle =
							(Math.PI * 2 * index) / PROFILE_TOPICS.length - Math.PI / 2;
						const x = 50 + Math.cos(angle) * 53;
						const y = 50 + Math.sin(angle) * 53;
						return (
							<button
								key={topic}
								type="button"
								onClick={() => setFocus(index)}
								className={`absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[0.58cqi] uppercase tracking-[0.1em] ${index === focus ? "text-tangerine" : "text-cream/38"}`}
								style={{ left: `${x}%`, top: `${y}%` }}
							>
								{topic}
							</button>
						);
					})}
				</div>

				<div>
					<p className="font-mono text-[0.62cqi] text-cream/35 uppercase tracking-[0.14em]">
						Discuss any topic with Sarjy
					</p>
					<p
						key={`${session.label}-${focus}`}
						className="case-value-enter mt-[1cqi] font-black text-[3cqi] leading-none"
					>
						{PROFILE_TOPICS[focus]}
					</p>
					<p className="mt-[0.65cqi] text-[1cqi] text-cream/45">
						{session.values[focus]}% evidence strength
					</p>
					<div className="mt-[2.2cqi] border-cream/15 border-t pt-[1.4cqi]">
						<p className="font-bold text-[1.15cqi]">
							“Show me why this is weaker.”
						</p>
						<p className="mt-[0.45cqi] text-[0.82cqi] text-cream/38">
							The profile is data—and a conversation surface.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

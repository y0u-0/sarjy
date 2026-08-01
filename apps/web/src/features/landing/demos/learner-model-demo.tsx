import { UserRound } from "lucide-react";

import { TinyLabel } from "../landing-primitives";

export function LearnerModelDemo() {
	const topics = [
		"Filtering",
		"Joins",
		"Grouping",
		"Windows",
		"CTEs",
		"Subqueries",
	] as const;
	const center = { x: 150, y: 105 };
	const radius = 64;
	const point = (index: number, strength: number) => {
		const angle = -Math.PI / 2 + (index * Math.PI * 2) / topics.length;
		return {
			x: center.x + Math.cos(angle) * radius * strength,
			y: center.y + Math.sin(angle) * radius * strength,
		};
	};
	const polygon = (strengths: number[]) =>
		strengths
			.map((strength, index) => {
				const value = point(index, strength);
				return `${value.x},${value.y}`;
			})
			.join(" ");
	const joinPoint = point(1, 0.72);

	return (
		<div className="rounded-3xl border border-ink bg-lime-soft p-5 text-ink sm:p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<TinyLabel>Then → now</TinyLabel>
					<p className="mt-2 font-extrabold text-2xl tracking-tight">
						See your evidence change.
					</p>
				</div>
				<UserRound className="size-7" />
			</div>
			<div className="mt-3 rounded-2xl border border-ink bg-cream/70 p-2">
				<svg
					viewBox="0 0 300 210"
					className="h-auto w-full"
					role="img"
					aria-label="Illustration of a learner skill radar growing between an earlier session and now"
				>
					{[0.33, 0.66, 1].map((level) => (
						<polygon
							key={level}
							points={polygon(topics.map(() => level))}
							fill="none"
							stroke="currentColor"
							strokeOpacity="0.16"
						/>
					))}
					{topics.map((topic, index) => {
						const edge = point(index, 1);
						const label = point(index, 1.28);
						return (
							<g key={topic}>
								<line
									x1={center.x}
									y1={center.y}
									x2={edge.x}
									y2={edge.y}
									stroke="currentColor"
									strokeOpacity="0.16"
								/>
								<text
									x={label.x}
									y={label.y}
									textAnchor="middle"
									className="fill-ink font-semibold text-[8px]"
								>
									{topic}
								</text>
							</g>
						);
					})}
					<polygon
						points={polygon([0.34, 0.42, 0.48, 0.2, 0.28, 0.32])}
						fill="none"
						stroke="currentColor"
						strokeOpacity="0.52"
						strokeWidth="2"
						strokeDasharray="5 4"
					/>
					<polygon
						points={polygon([0.86, 0.72, 0.78, 0.52, 0.66, 0.58])}
						fill="#7a78ff"
						fillOpacity="0.2"
						stroke="#7a78ff"
						strokeWidth="2.5"
					/>
					<circle
						cx={joinPoint.x}
						cy={joinPoint.y}
						r="8"
						fill="none"
						stroke="#ff7a55"
						strokeWidth="2"
					/>
					<circle cx={joinPoint.x} cy={joinPoint.y} r="3.5" fill="#ff7a55" />
				</svg>
				<div className="-mt-2 flex items-center justify-between gap-2 rounded-xl border border-ink bg-ink px-3 py-2 text-cream">
					<span className="font-mono text-[9px] text-tangerine uppercase">
						Sarjy spotlighted Joins
					</span>
					<span className="font-mono text-[9px] text-cream/45">Learn tab</span>
				</div>
			</div>
			<div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px]">
				<span className="rounded-full border border-ink px-2.5 py-1">
					dashed · earlier session
				</span>
				<span className="rounded-full border border-ink bg-periwinkle px-2.5 py-1">
					filled · now
				</span>
			</div>
		</div>
	);
}

import { RotateCcw } from "lucide-react";
import { type CSSProperties, useState } from "react";

export function FixedPaceDemo() {
	const [runId, setRunId] = useState(0);
	const learners = [
		{
			name: "Needs more time",
			distance: "20cqi",
			result: "left behind",
			color: "bg-tangerine",
		},
		{ name: "On pace", distance: "36cqi", result: "passes", color: "bg-lime" },
		{
			name: "Ready sooner",
			distance: "50cqi",
			result: "waits",
			color: "bg-periwinkle",
		},
		{
			name: "Already knows it",
			distance: "62cqi",
			result: "disengages",
			color: "bg-amber",
		},
	] as const;

	return (
		<div className="absolute inset-x-[4cqi] top-[8.2cqi] bottom-[5.2cqi]">
			<div className="flex items-end justify-between">
				<h2 className="font-black text-[4.4cqi] leading-[0.92] tracking-[-0.06em]">
					One pace.
					<br />
					<span className="text-tangerine">Four outcomes.</span>
				</h2>
				<button
					type="button"
					onClick={() => setRunId((current) => current + 1)}
					className="case-action-button"
				>
					<RotateCcw aria-hidden /> Run the class
				</button>
			</div>

			<div key={runId} className="mt-[4cqi] grid gap-[1.35cqi]">
				{learners.map((learner, index) => (
					<div
						key={learner.name}
						className="grid grid-cols-[13cqi_1fr_10cqi] items-center gap-[1.2cqi]"
					>
						<p className="font-semibold text-[0.88cqi] text-cream/55">
							{learner.name}
						</p>
						<div className="relative h-[1.6cqi] border-cream/16 border-y">
							<div className="absolute inset-y-0 left-[54%] w-px bg-cream/30" />
							<span className="absolute -top-[1.1cqi] left-[54%] -translate-x-1/2 font-mono text-[0.55cqi] text-cream/35 uppercase tracking-[0.12em]">
								lesson pace
							</span>
							<div
								className={`case-learner-run absolute top-1/2 left-0 size-[1.05cqi] -translate-y-1/2 rounded-full border-[0.15cqi] border-ink ${learner.color}`}
								style={{ "--case-distance": learner.distance } as CSSProperties}
							/>
						</div>
						<p
							className="case-outcome-enter font-bold font-mono text-[0.72cqi] text-tangerine uppercase tracking-[0.1em]"
							style={{ animationDelay: `${1050 + index * 100}ms` }}
						>
							{learner.result}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

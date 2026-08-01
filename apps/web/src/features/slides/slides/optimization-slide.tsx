import { ChevronRight, Database } from "lucide-react";

import { useSequence } from "../deck-primitives";

const OPTIMIZATION_STEPS = [
	{
		label: "Read",
		plan: "SCAN tracks",
		rows: "whole table",
		time: "baseline",
		color: "text-tangerine",
	},
	{
		label: "Predict",
		plan: "What will change?",
		rows: "your estimate",
		time: "commit first",
		color: "text-amber",
	},
	{
		label: "Index",
		plan: "SEARCH tracks USING idx_album",
		rows: "matching rows",
		time: "less work",
		color: "text-lime",
	},
	{
		label: "Compare",
		plan: "covering index vs rewrite",
		rows: "same answer",
		time: "best measured",
		color: "text-periwinkle",
	},
] as const;

export function OptimizationDemo() {
	const controls = useSequence(OPTIMIZATION_STEPS.length, 2200);
	const stage = OPTIMIZATION_STEPS[controls.step];

	return (
		<div className="absolute inset-x-[4cqi] top-[8.2cqi] bottom-[5.2cqi]">
			<div className="flex items-end justify-between">
				<h2 className="font-black text-[4.2cqi] leading-[0.92] tracking-[-0.06em]">
					Optimization
					<br />
					<span className="text-tangerine">becomes visible.</span>
				</h2>
				<p className="w-[26cqi] text-[1cqi] text-ink/48 leading-[1.4]">
					Read → predict → change → compare.
				</p>
			</div>

			<div className="mt-[3cqi] grid grid-cols-[1fr_31cqi] gap-[2cqi]">
				<div className="rounded-[1.2cqi] bg-ink p-[1.4cqi] text-cream">
					<div className="flex items-center justify-between font-mono text-[0.58cqi] text-cream/32 uppercase tracking-[0.14em]">
						<span>Query plan</span>
						<span>evidence</span>
					</div>
					<div
						key={stage.plan}
						className="case-plan-swap mt-[1.9cqi] flex items-center gap-[1cqi]"
					>
						<div
							className={`flex size-[3.4cqi] items-center justify-center rounded-full border border-cream/18 ${controls.step >= 2 ? "bg-lime text-ink" : "bg-tangerine text-ink"}`}
						>
							<Database className="size-[1.35cqi]" />
						</div>
						<div className="h-px flex-1 bg-cream/16">
							<div
								className={`h-[0.16cqi] origin-left ${controls.step >= 2 ? "case-fast-line bg-lime" : "case-slow-line bg-tangerine"}`}
							/>
						</div>
						<div className="flex h-[5.2cqi] w-[24cqi] items-center rounded-[0.8cqi] border border-cream/16 px-[1.1cqi]">
							<p
								className={`font-bold font-mono text-[0.83cqi] ${stage.color}`}
							>
								{stage.plan}
							</p>
						</div>
					</div>
					<div className="mt-[2.4cqi] grid grid-cols-2 border-cream/14 border-t pt-[1.5cqi]">
						<div>
							<p
								key={stage.rows}
								className="case-value-enter font-black text-[2.4cqi] leading-none"
							>
								{stage.rows}
							</p>
							<p className="mt-[0.35cqi] font-mono text-[0.58cqi] text-cream/32 uppercase tracking-[0.12em]">
								work performed
							</p>
						</div>
						<div>
							<p
								key={stage.time}
								className="case-value-enter font-black text-[2.4cqi] leading-none"
							>
								{stage.time}
							</p>
							<p className="mt-[0.35cqi] font-mono text-[0.58cqi] text-cream/32 uppercase tracking-[0.12em]">
								decision
							</p>
						</div>
					</div>
				</div>

				<div className="grid gap-[0.6cqi]">
					{OPTIMIZATION_STEPS.map((item, index) => (
						<button
							key={item.label}
							type="button"
							onClick={() => controls.setStep(index)}
							className={`case-opt-step ${index === controls.step ? "is-active" : ""}`}
						>
							<span className="font-mono text-[0.6cqi]">0{index + 1}</span>
							<strong>{item.label}</strong>
							<ChevronRight aria-hidden />
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

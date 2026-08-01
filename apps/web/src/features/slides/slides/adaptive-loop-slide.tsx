import { CircleGauge } from "lucide-react";

import { SequenceTabs, useSequence } from "../deck-primitives";

export function AdaptiveLoopDemo() {
	const controls = useSequence(5, 1900);
	const evidence = [
		{
			label: "Interview",
			value: "three short questions",
			color: "text-tangerine",
		},
		{
			label: "Submission",
			value: "JOIN multiplies rows",
			color: "text-amber",
		},
		{
			label: "Prediction",
			value: "expected one row",
			color: "text-lime",
		},
		{ label: "Voice", value: "show me the data", color: "text-lime" },
		{
			label: "Teach-back",
			value: "missing join cardinality",
			color: "text-periwinkle",
		},
	] as const;
	const actions = [
		"Place the first three",
		"Probe the prediction",
		"Animate the join",
		"Retry with new data",
		"Move to transfer",
	];

	return (
		<div className="absolute inset-x-[4cqi] top-[8.2cqi] bottom-[5.2cqi]">
			<h2 className="font-black text-[4.15cqi] leading-[0.92] tracking-[-0.06em]">
				Estimate. Adapt.
				<br />
				<span className="text-lime">Verify. Repeat.</span>
			</h2>

			<div className="mt-[3cqi] grid grid-cols-[27cqi_1fr_28cqi] items-center gap-[4cqi]">
				<div className="grid gap-[0.65cqi]">
					{evidence.map((item, index) => (
						<button
							key={item.label}
							type="button"
							onClick={() => controls.setStep(index)}
							className={`case-evidence-row ${index === controls.step ? "is-active" : ""}`}
						>
							<span className="font-mono text-[0.58cqi] text-cream/35">
								0{index + 1}
							</span>
							<span>
								<strong>{item.label}</strong>
								<small className={item.color}>{item.value}</small>
							</span>
						</button>
					))}
				</div>

				<div className="relative aspect-square">
					<div className="case-model-ring absolute inset-0 rounded-full border border-periwinkle/28" />
					<div className="case-model-ring absolute inset-[2.2cqi] rounded-full border border-lime/28 [animation-delay:280ms]" />
					<div className="absolute inset-[4.8cqi] flex flex-col items-center justify-center rounded-full bg-lime text-center text-ink">
						<CircleGauge className="size-[2.4cqi]" />
						<p className="mt-[0.65cqi] font-bold font-mono text-[0.58cqi] uppercase tracking-[0.14em]">
							Learner estimate
						</p>
						<p
							key={controls.step}
							className="case-value-enter mt-[0.45cqi] font-black text-[2cqi] leading-none"
						>
							{
								[
									"starting level",
									"uncertain",
									"misconception",
									"needs evidence",
									"ready to transfer",
								][controls.step]
							}
						</p>
					</div>
				</div>

				<div>
					<p className="font-mono text-[0.62cqi] text-cream/35 uppercase tracking-[0.15em]">
						Next teaching move
					</p>
					<div
						key={actions[controls.step]}
						className="case-next-move mt-[1.2cqi] border-lime border-l-[0.22cqi] pl-[1.4cqi]"
					>
						<p className="font-black text-[2.4cqi] leading-[1.02]">
							{actions[controls.step]}
						</p>
						<p className="mt-[1cqi] text-[0.85cqi] text-cream/45">
							One decision. Based on the latest evidence.
						</p>
					</div>
				</div>
			</div>

			<div className="absolute right-0 bottom-[0.6cqi]">
				<SequenceTabs
					labels={["Interview", "Submit", "Predict", "Ask", "Explain"]}
					controls={controls}
				/>
			</div>
		</div>
	);
}

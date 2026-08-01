import { Check } from "lucide-react";

import { SequenceTabs, useSequence } from "../deck-primitives";

export function VerificationDemo() {
	const controls = useSequence(4, 1800);
	const steps = [
		{ label: "Solve", value: "Query passes", note: "execution" },
		{ label: "Explain", value: "Why it works", note: "reasoning" },
		{ label: "Transfer", value: "New data shape", note: "generalization" },
		{ label: "Remember", value: "Next session", note: "retention" },
	] as const;

	return (
		<div className="absolute inset-x-[4cqi] top-[8.2cqi] bottom-[5.2cqi]">
			<h2 className="font-black text-[4.35cqi] leading-[0.92] tracking-[-0.06em]">
				A correct answer
				<br />
				<span className="text-periwinkle">is not enough.</span>
			</h2>

			<div className="mt-[4cqi] grid grid-cols-4 border-ink/18 border-y">
				{steps.map((item, index) => {
					const active = index === controls.step;
					const complete = index < controls.step;
					return (
						<button
							key={item.label}
							type="button"
							onClick={() => controls.setStep(index)}
							className={`relative min-h-[17cqi] px-[1.5cqi] py-[1.5cqi] text-left ${index > 0 ? "border-ink/18 border-l" : ""}`}
						>
							<div
								className={`flex size-[2.4cqi] items-center justify-center rounded-full border-[0.12cqi] border-ink transition-[transform,background-color] duration-200 ease-out motion-reduce:transition-none ${active ? "scale-110 bg-periwinkle text-cream" : complete ? "bg-lime" : "bg-transparent"}`}
							>
								{complete ? (
									<Check className="size-[1.1cqi]" />
								) : (
									<span className="font-mono text-[0.7cqi]">0{index + 1}</span>
								)}
							</div>
							<p className="mt-[2.2cqi] font-mono text-[0.62cqi] text-ink/42 uppercase tracking-[0.14em]">
								{item.note}
							</p>
							<p className="mt-[0.5cqi] font-black text-[1.4cqi]">
								{item.label}
							</p>
							<p
								className={`mt-[0.35cqi] text-[0.82cqi] transition-opacity duration-200 motion-reduce:transition-none ${active ? "opacity-65" : "opacity-0"}`}
							>
								{item.value}
							</p>
							{active && (
								<span className="case-active-line absolute right-0 bottom-0 left-0 h-[0.22cqi] origin-left bg-periwinkle" />
							)}
						</button>
					);
				})}
			</div>

			<div className="absolute right-0 bottom-[0.4cqi]">
				<SequenceTabs
					labels={steps.map((item) => item.label)}
					controls={controls}
				/>
			</div>
		</div>
	);
}

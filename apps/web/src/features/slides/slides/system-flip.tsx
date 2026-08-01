import { ArrowRight } from "lucide-react";

import { useSequence } from "../deck-primitives";

export function getAdaptationRelationship(adapted: boolean) {
	return {
		source: adapted ? "system" : "learner",
		target: adapted ? "learner" : "system",
		rotationClass: "rotate-[-90deg]",
	} as const;
}

export function SystemFlip() {
	const controls = useSequence(2, 2600);
	const adapted = controls.step === 1;
	const relationship = getAdaptationRelationship(adapted);

	return (
		<div className="relative h-full">
			<div className="absolute top-[9.3cqi] left-[4cqi] w-[51cqi]">
				<h1 className="font-black text-[5.55cqi] leading-[0.9] tracking-[-0.068em]">
					Education asks
					<br />
					students to adapt.
				</h1>
				<p className="mt-[2.4cqi] font-black text-[3cqi] text-tangerine leading-none tracking-[-0.05em]">
					We reverse it.
				</p>
			</div>

			<div className="absolute top-[8.5cqi] right-[4cqi] h-[38cqi] w-[36cqi]">
				<div className="absolute inset-y-0 left-1/2 w-px bg-ink/18" />
				<div
					className={`absolute top-[2cqi] left-1/2 flex h-[10cqi] w-[25cqi] -translate-x-1/2 items-center justify-center rounded-[5cqi] border-[0.14cqi] border-ink bg-ink font-black text-[1.4cqi] text-cream uppercase tracking-[0.08em] transition-transform duration-500 [transition-timing-function:cubic-bezier(.77,0,.175,1)] motion-reduce:transition-none ${
						adapted ? "translate-y-[22cqi]" : "translate-y-0"
					}`}
				>
					The system
				</div>
				<div
					className={`absolute bottom-[2cqi] left-1/2 flex h-[10cqi] w-[25cqi] -translate-x-1/2 items-center justify-center rounded-[5cqi] border-[0.14cqi] border-ink bg-lime font-black text-[1.4cqi] uppercase tracking-[0.08em] transition-transform duration-500 [transition-timing-function:cubic-bezier(.77,0,.175,1)] motion-reduce:transition-none ${
						adapted ? "-translate-y-[22cqi]" : "translate-y-0"
					}`}
				>
					The learner
				</div>
				<div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[0.8cqi]">
					<ArrowRight
						aria-label={`The ${relationship.source} adapts to the ${relationship.target}`}
						className={`size-[3cqi] transition-transform duration-500 [transition-timing-function:cubic-bezier(.77,0,.175,1)] motion-reduce:transition-none ${relationship.rotationClass}`}
					/>
				</div>
			</div>

			<div className="absolute right-[12cqi] bottom-[6.3cqi] flex gap-[0.6cqi]">
				{["Student adapts", "System adapts"].map((label, index) => (
					<button
						key={label}
						type="button"
						onClick={() => controls.setStep(index)}
						className={`case-choice ${controls.step === index ? "is-active" : ""}`}
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}

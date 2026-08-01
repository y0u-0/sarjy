import { SarjyOrb } from "@/components/teacher/sarjy-orb";

import { INPUT_VOLUME, OUTPUT_VOLUME } from "../deck-primitives";

export function ClosingSlide() {
	return (
		<>
			<div className="absolute inset-x-[4cqi] top-[10.5cqi]">
				<p className="font-black text-[4.8cqi] text-ink/38 leading-[0.92] tracking-[-0.065em] line-through decoration-[0.35cqi] decoration-tangerine">
					Scale one teacher.
				</p>
				<h2 className="mt-[2.4cqi] max-w-[78cqi] font-black text-[6.35cqi] leading-[0.88] tracking-[-0.075em]">
					Scale the ability
					<br />
					to adapt.
				</h2>
			</div>
			<div className="absolute right-[4cqi] bottom-[6.5cqi] flex items-center gap-[1cqi]">
				<div className="size-[5.2cqi]">
					<SarjyOrb
						state="talking"
						getInputVolume={INPUT_VOLUME}
						getOutputVolume={OUTPUT_VOLUME}
						className="size-full"
					/>
				</div>
				<p className="w-[21cqi] font-semibold text-[0.95cqi] leading-[1.35]">
					One learner model. Every next move personalized.
				</p>
			</div>
		</>
	);
}

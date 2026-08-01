import { cn } from "@sarjy-sql/ui/lib/utils";

import {
	SARJY_MOUTH_JITTER,
	SARJY_MOUTH_REST_PX,
	type SarjyState,
} from "./sarjy-orb-animation";
import { useSarjyOrbAnimation } from "./use-sarjy-orb-animation";

export type { SarjyState } from "./sarjy-orb-animation";

interface SarjyOrbProps {
	state: SarjyState;
	getInputVolume: () => number;
	getOutputVolume: () => number;
	className?: string;
}

export function SarjyOrb({
	state,
	getInputVolume,
	getOutputVolume,
	className,
}: SarjyOrbProps) {
	const { micRingRef, mouthRefs, rootRef } = useSarjyOrbAnimation({
		state,
		getInputVolume,
		getOutputVolume,
	});
	const connected = state !== null;

	return (
		<div ref={rootRef} className={cn("relative", className)}>
			<div
				ref={micRingRef}
				aria-hidden
				className="absolute -inset-1 rounded-full border-2 border-lime opacity-0 transition-opacity duration-200"
			/>
			<div
				className={cn(
					"relative flex size-full flex-col items-center justify-center overflow-hidden rounded-full border transition-colors duration-300",
					connected
						? "animate-orb-breathe border-ink bg-periwinkle"
						: "border-border bg-muted",
				)}
			>
				{state === "thinking" && (
					<div className="absolute inset-1.5 animate-spin rounded-full border-2 border-ink/30 border-dashed [animation-duration:2.4s] motion-reduce:animate-none" />
				)}
				<div
					className={cn(
						"flex w-full items-center justify-center gap-[14%]",
						state === "thinking" && "animate-orb-scan",
					)}
				>
					<span
						className={cn(
							"w-[11%] rounded-full bg-ink transition-all duration-300",
							connected ? "h-[17px] animate-orb-blink" : "h-[3px]",
						)}
					/>
					<span
						className={cn(
							"w-[11%] rounded-full bg-ink transition-all duration-300",
							connected ? "h-[17px] animate-orb-blink" : "h-[3px]",
						)}
						style={{ animationDuration: "5.3s" }}
					/>
				</div>
				<div className="mt-[12%] flex h-[22px] items-center justify-center gap-[8%]">
					{SARJY_MOUTH_JITTER.map((jitter, index) => (
						<span
							key={jitter}
							ref={(element) => {
								mouthRefs.current[index] = element;
							}}
							className={cn(
								"w-[7%] min-w-1 rounded-full bg-ink",
								!connected && "opacity-40",
							)}
							style={{ height: `${SARJY_MOUTH_REST_PX}px` }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

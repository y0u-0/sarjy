import { cn } from "@sarjy-sql/ui/lib/utils";
import { ArrowRight, Check, Eye } from "lucide-react";

import { SarjyOrb } from "@/components/teacher/sarjy-orb";

import { ORB_INPUT, ORB_OUTPUT, TinyLabel } from "../landing-primitives";

export function PersonalizationLoopDemo() {
	const signals = [
		{ label: "Expected", value: "I'm sure", tone: "bg-lime" },
		{ label: "Submitted", value: "wrong row count", tone: "bg-tangerine" },
		{ label: "Explained", value: "JOIN filters", tone: "bg-amber" },
	] as const;

	return (
		<div
			className="landing-loop relative overflow-hidden rounded-[2rem] border border-ink bg-ink p-3 text-cream sm:p-5"
			data-landing-reveal="scale"
		>
			<div className="flex flex-wrap items-center justify-between gap-3 border-cream/12 border-b px-2 pb-4">
				<div className="flex items-center gap-2">
					<span className="landing-presence-dot size-2 rounded-full bg-lime" />
					<TinyLabel>What Sarjy learns about you</TinyLabel>
				</div>
				<span className="font-mono text-[9px] text-cream/40 uppercase tracking-[0.1em]">
					updated step by step
				</span>
			</div>

			<div className="relative mt-3 grid gap-3 lg:grid-cols-12">
				<div className="landing-loop-panel rounded-2xl border border-cream/14 bg-cream/5 p-4 lg:col-span-4">
					<div className="flex items-center justify-between">
						<TinyLabel>Sarjy sees the whole attempt</TinyLabel>
						<Eye className="size-4 text-periwinkle" />
					</div>
					<div className="mt-4 grid gap-2">
						{signals.map((signal, index) => (
							<div
								key={signal.label}
								className="landing-loop-signal flex items-center gap-3 rounded-xl border border-cream/10 bg-ink-soft p-3"
								style={{ animationDelay: `${index * 320}ms` }}
							>
								<span className={cn("size-2 rounded-full", signal.tone)} />
								<div>
									<p className="font-mono text-[9px] text-cream/35 uppercase">
										{signal.label}
									</p>
									<p className="mt-0.5 font-bold text-sm">{signal.value}</p>
								</div>
								<Check className="ml-auto size-3.5 text-cream/25" />
							</div>
						))}
					</div>
				</div>

				<div className="landing-loop-panel relative overflow-hidden rounded-2xl border border-ink bg-periwinkle p-4 text-ink lg:col-span-3">
					<div className="landing-model-ring absolute -top-10 -right-10 size-28 rounded-full border border-ink/20" />
					<TinyLabel>Sarjy updates its understanding</TinyLabel>
					<div className="relative mt-5 flex items-center gap-3">
						<div className="size-14 shrink-0">
							<SarjyOrb
								state="thinking"
								getInputVolume={ORB_INPUT}
								getOutputVolume={ORB_OUTPUT}
								className="size-full"
							/>
						</div>
						<div>
							<p className="font-black text-xl leading-[1.08] tracking-tight">
								The picture gets sharper
							</p>
							<p className="mt-1 font-mono text-[9px] text-ink/55">
								graded work + explicit teach-back
							</p>
						</div>
					</div>
					<div className="mt-5 grid gap-3 border-ink/15 border-t pt-4">
						{[
							["join evidence", "needs transfer", "62%", "bg-amber"],
							["teach-back", "not there yet", "34%", "bg-tangerine"],
						].map(([label, value, width, tone]) => (
							<div key={label}>
								<div className="flex items-end justify-between gap-2">
									<p className="font-mono text-[9px] uppercase">{label}</p>
									<p className="font-semibold text-[10px]">{value}</p>
								</div>
								<div className="mt-1.5 h-2 overflow-hidden rounded-full border border-ink/25 bg-cream/45">
									<div
										className={cn(
											"landing-model-meter h-full origin-left",
											tone,
										)}
										style={{ width }}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="landing-loop-panel relative overflow-hidden rounded-2xl border border-ink bg-lime p-4 text-ink lg:col-span-5">
					<div className="flex items-center justify-between gap-3">
						<TinyLabel>The three-question queue</TinyLabel>
						<span className="landing-adjusted-badge rounded-full border border-ink bg-ink px-2.5 py-1 font-mono text-[9px] text-lime uppercase">
							slot replaced
						</span>
					</div>
					<div className="mt-5 rounded-2xl border border-ink bg-cream p-4">
						<p className="font-mono text-[9px] text-ink/45 uppercase">
							Question 2 of 3 · chosen next
						</p>
						<p className="mt-2 font-black text-2xl leading-[1.04] tracking-tight sm:text-3xl sm:leading-[1.02]">
							Fix the join that multiplied your rows.
						</p>
					</div>
					<div className="mt-2 grid gap-2 sm:grid-cols-2">
						<div className="rounded-xl border border-ink/20 bg-ink/5 p-3">
							<p className="font-mono text-[9px] uppercase">
								How Sarjy explains
							</p>
							<p className="mt-1 font-bold text-sm">Rows before rules</p>
						</div>
						<div className="rounded-xl border border-ink/20 bg-ink/5 p-3">
							<p className="font-mono text-[9px] uppercase">How much help</p>
							<p className="mt-1 font-bold text-sm">One nudge first</p>
						</div>
					</div>
				</div>

				<ArrowRight className="landing-loop-arrow landing-loop-arrow-one absolute top-1/2 left-[32.5%] z-10 hidden size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/20 bg-ink p-1 text-lime lg:block" />
				<ArrowRight className="landing-loop-arrow landing-loop-arrow-two absolute top-1/2 left-[58.5%] z-10 hidden size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream/20 bg-ink p-1 text-lime lg:block" />
			</div>
		</div>
	);
}

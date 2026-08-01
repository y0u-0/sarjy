import { cn } from "@sarjy-sql/ui/lib/utils";
import { Database, Sparkles } from "lucide-react";
import { LearnerModelDemo } from "../demos/learner-model-demo";
import {
	ConfidenceDemo,
	QueryEvidenceDemo,
	TeacherControlDemo,
} from "../demos/learning-evidence-demos";
import { TinyLabel } from "../landing-primitives";

export function EvidenceSection() {
	return (
		<section className="mx-auto max-w-6xl px-5 py-20 sm:px-7 sm:py-28">
			<div
				className="grid items-end gap-5 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]"
				data-landing-reveal="up"
			>
				<div>
					<p className="font-mono text-[11px] text-ink/50 uppercase tracking-[0.14em]">
						Same work. Same view.
					</p>
					<h2 className="mt-3 max-w-md text-balance font-black text-4xl leading-none tracking-[-0.04em] sm:text-6xl sm:leading-[0.97]">
						Your teacher sees what you see.
					</h2>
				</div>
				<p className="max-w-lg text-pretty text-ink/60 text-sm leading-relaxed sm:text-base md:justify-self-end">
					Your query, its measured rows, and your reasoning stay together. Sarjy
					can pause a walkthrough, point to a row, switch a profile tab, or
					spotlight the topic she is discussing.
				</p>
			</div>

			<div className="mt-10 grid gap-4 lg:grid-cols-12">
				<article
					className="rounded-3xl border border-ink bg-ink p-3 lg:col-span-7 lg:row-span-2"
					data-landing-reveal="left"
				>
					<div className="flex items-center justify-between px-2 py-1.5 text-cream">
						<TinyLabel>Your query, made visible</TinyLabel>
						<Database className="size-4 text-lime" />
					</div>
					<div className="mt-2">
						<QueryEvidenceDemo />
					</div>
					<div className="grid gap-2 pt-2 sm:grid-cols-3">
						{[
							["Goal", "2 rows"],
							["Yours", "2 rows"],
							["Grade", "Correct"],
						].map(([label, value]) => (
							<div
								key={label}
								className="rounded-xl border border-cream/12 bg-cream/5 px-3 py-2 text-cream"
							>
								<p className="font-mono text-[9px] text-cream/40 uppercase">
									{label}
								</p>
								<p
									className={cn(
										"mt-0.5 font-bold text-sm",
										label === "Grade" && "text-lime",
									)}
								>
									{value}
								</p>
							</div>
						))}
					</div>
				</article>

				<article
					className="[transition-delay:70ms] lg:col-span-5"
					data-landing-reveal="right"
				>
					<ConfidenceDemo />
				</article>
				<article
					className="[transition-delay:120ms] lg:col-span-5"
					data-landing-reveal="right"
				>
					<TeacherControlDemo />
				</article>

				<article className="lg:col-span-5" data-landing-reveal="left">
					<LearnerModelDemo />
				</article>
				<article
					className="relative min-h-72 overflow-hidden rounded-3xl border border-ink bg-sky p-5 text-ink [transition-delay:70ms] lg:col-span-7"
					data-landing-reveal="right"
				>
					<div className="flex items-center justify-between">
						<TinyLabel>Hints land in the editor</TinyLabel>
						<Sparkles className="size-5" />
					</div>
					<p className="mt-3 max-w-md font-extrabold text-3xl leading-[1.04] tracking-[-0.035em] sm:text-4xl sm:leading-[1.02]">
						A nudge. Then a hint. The answer only when you ask.
					</p>
					<div className="absolute right-4 bottom-4 left-4 overflow-hidden rounded-2xl border border-ink bg-ink p-4 font-mono text-cream text-xs">
						<p className="line-through decoration-tangerine opacity-30">
							SELECT title FROM albums
						</p>
						<p className="landing-ghost-hint mt-2 text-lime">
							SELECT title FROM albums WHERE genre = 'Rock'
						</p>
						<div className="mt-3 flex items-center gap-2 text-[9px] text-cream/45">
							<span className="rounded border border-cream/20 px-1.5 py-0.5">
								Tab
							</span>
							use it
							<span className="rounded border border-cream/20 px-1.5 py-0.5">
								Esc
							</span>
							keep mine
						</div>
					</div>
				</article>
			</div>
		</section>
	);
}

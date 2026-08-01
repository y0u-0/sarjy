import { PersonalizationLoopDemo } from "../demos/personalization-loop-demo";

export function AdaptationSection() {
	return (
		<section className="mx-auto max-w-6xl px-5 pt-24 pb-14 sm:px-7 sm:pt-32 sm:pb-20">
			<div
				className="grid items-end gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
				data-landing-reveal="up"
			>
				<div>
					<p className="font-mono text-[11px] text-ink/50 uppercase tracking-[0.14em]">
						It learns while you learn
					</p>
					<h2 className="mt-3 max-w-xl text-balance font-black text-4xl leading-[0.99] tracking-[-0.045em] sm:text-6xl sm:leading-[0.96]">
						Every move teaches Sarjy something.
					</h2>
				</div>
				<p className="max-w-lg text-pretty text-ink/60 text-sm leading-relaxed sm:text-base md:justify-self-end">
					It combines graded submissions, prediction accuracy, teach-backs, and
					what you explicitly ask for. Then it keeps, replaces, or deepens one
					of your three questions.
				</p>
			</div>
			<div className="mt-10">
				<PersonalizationLoopDemo />
			</div>
		</section>
	);
}

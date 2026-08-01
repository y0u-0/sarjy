import { cn } from "@sarjy-sql/ui/lib/utils";
import { Link } from "@tanstack/react-router";

import {
	adviseOnConcept,
	type ConceptProfileView,
	describeConceptState,
	describeMistake,
	relativePracticeDate,
} from "./concept-card-model";

export type { ConceptProfileView } from "./concept-card-model";

/**
 * One concept, and what to do about it.
 *
 * The bar is the aged estimate, so a topic left alone for weeks visibly slips —
 * that is the point of showing it rather than a lifetime high score. What it never
 * does is show a raw percentage as a grade: the label carries the meaning and the
 * number is there only so a student who wants to argue with it has something to
 * point at.
 */
export function ConceptCard({
	profile,
	title,
}: {
	profile: ConceptProfileView;
	title: string;
}) {
	const { current, opportunities, passes, trajectory, mistakes, everMastered } =
		profile;

	const state = describeConceptState(current, everMastered, trajectory);
	const advice = adviseOnConcept(profile);
	const isOptimization = profile.concept.startsWith("optimization-");

	return (
		<article className="rounded-2xl border border-border bg-card p-4">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-bold text-base">{title}</h2>
				<span
					className={cn(
						"shrink-0 rounded-full px-2 py-0.5 font-semibold text-xs",
						state.tone,
					)}
				>
					{state.label}
				</span>
			</div>

			<div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink-soft">
				<div
					className={cn(
						"h-full origin-left rounded-full transition-transform duration-200 motion-reduce:transition-none",
						state.fill,
					)}
					style={{ transform: `scaleX(${Math.max(0.03, current)})` }}
				/>
			</div>

			<p className="mt-2 text-muted-foreground text-xs tabular-nums">
				{passes} right of {opportunities}
				{passes > 0 && ` · ${profile.unassistedPasses} without help`}
				{profile.lastSeenAt &&
					` · last touched ${relativePracticeDate(profile.lastSeenAt)}`}
			</p>

			<div className="mt-2 flex flex-wrap gap-1.5">
				<span
					className={cn(
						"rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]",
						profile.explanation === "correct"
							? "border-lime/50 bg-lime/10 text-lime"
							: profile.explanation === "incorrect"
								? "border-tangerine/50 bg-tangerine/10 text-tangerine"
								: "border-border text-muted-foreground",
					)}
				>
					Understanding: {profile.explanation ?? "not checked"}
				</span>
				{profile.assistedPasses > 0 && (
					<span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
						{profile.assistedPasses} assisted pass
						{profile.assistedPasses === 1 ? "" : "es"}
					</span>
				)}
			</div>

			{mistakes.length > 0 && (
				<div className="mt-3">
					<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
						What trips you here
					</p>
					<ul className="mt-1.5 flex flex-col gap-1">
						{mistakes.slice(0, 3).map((mistake) => (
							<li
								key={mistake.kind}
								className="flex items-baseline justify-between gap-3 text-sm"
							>
								<span>{describeMistake(mistake.kind)}</span>
								<span className="shrink-0 font-mono text-muted-foreground text-xs tabular-nums">
									{mistake.count}×
								</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<p className="mt-3 border-border border-t pt-3 text-sm leading-relaxed">
				{advice}
			</p>

			{!isOptimization && current < 0.95 && (
				<Link
					to="/learn"
					className="mt-3 inline-block rounded-full border border-border px-3 py-1 font-medium text-xs transition-colors hover:border-lime hover:text-lime"
				>
					Open your three questions
				</Link>
			)}

			{isOptimization && current < 0.95 && (
				<Link
					to="/learn/optimize"
					className="mt-3 inline-block rounded-full border border-border px-3 py-1 font-medium text-xs transition-colors hover:border-lime hover:text-lime"
				>
					Open the optimization playground
				</Link>
			)}
		</article>
	);
}

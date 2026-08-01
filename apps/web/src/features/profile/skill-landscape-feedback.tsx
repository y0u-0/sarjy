import type { ConceptProfileView } from "@/components/practice/concept-card";

import type { SkillHistorySnapshotView } from "./skill-landscape-model";

export function SkillLandscapeHistory({
	history,
	pending,
	error,
	comparison,
	changed,
}: {
	history: SkillHistorySnapshotView[];
	pending: boolean;
	error: boolean;
	comparison: SkillHistorySnapshotView | undefined;
	changed: { grew: number; cooled: number };
}) {
	if (pending)
		return (
			<p className="mt-3 text-muted-foreground text-xs">
				Replaying earlier sessions…
			</p>
		);
	if (error)
		return (
			<p className="mt-3 text-tangerine text-xs">
				Couldn’t load the earlier session comparison right now.
			</p>
		);
	if (history.length === 0)
		return (
			<div className="mt-3 rounded-xl border border-border border-dashed px-3 py-2.5">
				<p className="font-semibold text-xs">
					One more session makes this move.
				</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					Complete work in a second study session to compare a real earlier
					snapshot with now.
				</p>
			</div>
		);
	if (!comparison) return null;

	return (
		<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
			<span className="inline-flex items-center gap-1.5 text-muted-foreground">
				<span className="size-2 rounded-full border border-muted-foreground" />
				Then · session {comparison.sessionNumber}
			</span>
			<span className="inline-flex items-center gap-1.5 font-semibold">
				<span className="size-2 rounded-full bg-lime" /> Now
			</span>
			<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.06em]">
				{changed.grew} grew · {changed.cooled} cooled
			</span>
		</div>
	);
}

export function SkillSpotlight({
	profile,
	note,
	titleFor,
}: {
	profile: ConceptProfileView | null;
	note: string | null;
	titleFor: (concept: string) => string;
}) {
	if (!profile) return null;
	return (
		<div className="mt-3 flex flex-wrap items-baseline gap-x-2 rounded-xl border border-tangerine/50 bg-tangerine/10 px-3 py-2 text-xs">
			<span className="font-bold text-tangerine">
				Spotlight: {titleFor(profile.concept)}
			</span>
			<span className="text-muted-foreground">
				{profile.passes}/{profile.opportunities} right now
			</span>
			{note && <span>{note}</span>}
		</div>
	);
}

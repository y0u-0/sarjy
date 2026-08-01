import { useMemo, useState } from "react";

import {
	SkillLandscapeControls,
	SkillLandscapeHeader,
} from "@/features/profile/skill-landscape-controls";
import {
	SkillLandscapeHistory,
	SkillSpotlight,
} from "@/features/profile/skill-landscape-feedback";
import {
	buildSkillLandscapeModel,
	type SkillHistorySnapshotView,
	type SkillLandscapeView,
} from "@/features/profile/skill-landscape-model";
import { SkillRadarChart } from "@/features/profile/skill-radar-chart";

import type { ConceptProfileView } from "./concept-card";

export type {
	SkillHistorySnapshotView,
	SkillLandscapeView,
} from "@/features/profile/skill-landscape-model";

interface SkillLandscapeProps {
	profiles: ConceptProfileView[];
	history: SkillHistorySnapshotView[];
	historyPending: boolean;
	historyError: boolean;
	view: SkillLandscapeView;
	onViewChange: (view: SkillLandscapeView) => void;
	comparisonId: string | null;
	onComparisonChange: (id: string | null) => void;
	focusedConcept: string | null;
	focusNote: string | null;
	titleFor: (concept: string) => string;
}

/** A current learner model overlaid on one honest historical replay. */
export function SkillLandscape({
	profiles,
	history,
	historyPending,
	historyError,
	view,
	onViewChange,
	comparisonId,
	onComparisonChange,
	focusedConcept,
	focusNote,
	titleFor,
}: SkillLandscapeProps) {
	const [inspectedConcept, setInspectedConcept] = useState<string | null>(null);
	const model = useMemo(
		() =>
			buildSkillLandscapeModel({
				profiles,
				history,
				view,
				comparisonId,
				focusedConcept,
				titleFor,
			}),
		[profiles, history, view, comparisonId, focusedConcept, titleFor],
	);
	const inspected =
		model.rows.find((row) => row.concept === inspectedConcept) ?? model.focused;

	return (
		<section
			id="skill-landscape"
			className="mt-6 scroll-mt-6 rounded-2xl border border-border bg-card p-5"
		>
			<SkillLandscapeHeader totalAttempts={model.totalAttempts} />
			<SkillLandscapeControls
				view={view}
				onViewChange={onViewChange}
				history={history}
				comparisonId={comparisonId}
				onComparisonChange={onComparisonChange}
			/>
			<SkillLandscapeHistory
				history={history}
				pending={historyPending}
				error={historyError}
				comparison={model.comparison}
				changed={model.changed}
			/>
			<SkillSpotlight
				profile={model.focused}
				note={focusNote}
				titleFor={titleFor}
			/>
			<SkillRadarChart
				rows={model.chartRows}
				comparisonRows={model.comparisonChartRows}
				hasComparison={model.comparison !== undefined}
				focusedConcept={focusedConcept}
				ariaSummary={model.ariaSummary}
				onInspect={setInspectedConcept}
			/>
			{inspected && (
				<p className="-mt-2 text-center text-xs" aria-live="polite">
					<span className="font-semibold">{titleFor(inspected.concept)}</span>
					<span className="text-muted-foreground">
						{" "}
						· {inspected.passes}/{inspected.opportunities} exercise
						{inspected.opportunities === 1 ? "" : "s"} right
					</span>
				</p>
			)}
			<p className="text-center text-[11px] text-muted-foreground">
				Retries on one exercise stay in the coaching log but count as one point
				here. Unstarted topics stay at the center.
			</p>
		</section>
	);
}

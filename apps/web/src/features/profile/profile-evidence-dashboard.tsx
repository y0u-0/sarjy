import { Link } from "@tanstack/react-router";

import { ConceptCard } from "@/components/practice/concept-card";
import {
	type SkillHistorySnapshotView,
	SkillLandscape,
	type SkillLandscapeView,
} from "@/components/practice/skill-landscape";

import type { ProfileEvidenceModel } from "./profile-model";
import { ProfileStats } from "./profile-stats";

function ConceptEvidenceList({
	evidence,
	titleFor,
}: {
	evidence: ProfileEvidenceModel;
	titleFor: (concept: string) => string;
}) {
	return (
		<>
			<section className="mt-6 flex flex-col gap-3">
				{evidence.orderedStarted.map((row) => (
					<ConceptCard
						key={row.concept}
						profile={row}
						title={titleFor(row.concept)}
					/>
				))}
			</section>

			{evidence.notStarted.length > 0 && (
				<section className="mt-6 rounded-2xl border border-border border-dashed p-4">
					<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
						Not started
					</p>
					<div className="mt-2 flex flex-wrap gap-2">
						{evidence.notStarted.map((row) => (
							<span
								key={row.concept}
								className="rounded-full border border-border px-2.5 py-1 text-muted-foreground text-xs"
							>
								{titleFor(row.concept)}
							</span>
						))}
					</div>
				</section>
			)}
		</>
	);
}

export function EmptyProfileEvidence() {
	return (
		<section className="mt-8 rounded-2xl border border-border bg-card p-6">
			<p className="font-semibold text-sm">Nothing to show yet.</p>
			<p className="mt-1 text-muted-foreground text-sm leading-relaxed">
				This page fills in as you submit answers. Do a couple of exercises and
				come back.
			</p>
			<Link
				to="/learn"
				className="mt-4 inline-block rounded-full bg-lime px-4 py-1.5 font-semibold text-ink text-sm transition-opacity hover:opacity-90"
			>
				See your three questions
			</Link>
		</section>
	);
}

export function ProfileEvidenceDashboard({
	evidence,
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
}: {
	evidence: ProfileEvidenceModel;
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
}) {
	return (
		<>
			<SkillLandscape
				profiles={evidence.rows}
				history={history}
				historyPending={historyPending}
				historyError={historyError}
				view={view}
				onViewChange={onViewChange}
				comparisonId={comparisonId}
				onComparisonChange={onComparisonChange}
				focusedConcept={focusedConcept}
				focusNote={focusNote}
				titleFor={titleFor}
			/>
			<ProfileStats evidence={evidence} />
			<ConceptEvidenceList evidence={evidence} titleFor={titleFor} />
		</>
	);
}

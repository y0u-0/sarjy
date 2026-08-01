import { GradeBanner } from "@/components/grade-banner";
import { JoinWalkthrough } from "@/components/optimize/join-walkthrough";
import { TableWalkthrough } from "@/components/optimize/table-walkthrough";
import { PracticeOffer } from "@/components/practice/practice-offer";
import { ResultDiff } from "@/components/result-diff";
import { ResultsTable } from "@/components/results-table";
import type { QueryResult } from "@/lib/sql-engine/types";

import type {
	ExerciseWorkspaceActions,
	ExerciseWorkspaceViewModel,
} from "./exercise-workspace-types";

export function ExerciseFeedback({
	exerciseId,
	ordered,
	view,
	actions,
}: {
	exerciseId: string;
	ordered: boolean;
	view: ExerciseWorkspaceViewModel;
	actions: ExerciseWorkspaceActions;
}) {
	return (
		<>
			{view.grade && (
				<div className="shrink-0 animate-stamp">
					<GradeBanner
						grade={view.grade}
						nextId={view.adaptiveNext.id}
						nextLabel={view.adaptiveNext.label}
						choosingNext={
							view.grade.pass &&
							(!view.offer || view.recordingAttempt || view.queueFetching)
						}
					/>
				</div>
			)}
			{view.offer && (
				<PracticeOffer
					key={exerciseId}
					action={view.offer.action}
					reason={view.offer.reason}
					signals={view.offer.signals}
				/>
			)}
			{view.walk?.supported && (
				<div className="shrink-0">
					{view.walk.join ? (
						<JoinWalkthrough
							join={view.walk.join}
							replayKey={view.diffReplayKey}
							onRegister={actions.registerWalk}
						/>
					) : (
						<TableWalkthrough
							walk={view.walk}
							replayKey={view.diffReplayKey}
							onRegister={actions.registerWalk}
						/>
					)}
				</div>
			)}
			{view.grade && view.result && view.expected && (
				<div className="max-h-72 shrink-0 overflow-y-auto rounded-2xl border border-border bg-ink-soft p-3">
					<ResultDiff
						actual={view.result}
						expected={view.expected}
						ordered={ordered}
						replayKey={view.diffReplayKey}
					/>
				</div>
			)}
			{view.sqlError && (
				<div className="shrink-0 rounded-2xl border border-tangerine/50 bg-tangerine/10 px-4 py-2.5 font-mono text-sm text-tangerine">
					{view.sqlError}
				</div>
			)}
		</>
	);
}

export function ResultPanels({
	expected,
	result,
}: {
	expected: QueryResult | null;
	result: QueryResult | null;
}) {
	return (
		<div className="grid min-h-64 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
			<ResultPanel
				title="Goal: make your query produce this"
				result={expected}
				goal
			/>
			<ResultPanel title="Your result" result={result} />
		</div>
	);
}

function ResultPanel({
	title,
	result,
	goal = false,
}: {
	title: string;
	result: QueryResult | null;
	goal?: boolean;
}) {
	return (
		<section className="flex min-h-0 flex-col">
			<p className="mb-1 flex shrink-0 items-center gap-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
				<span
					className={`inline-block size-1.5 rounded-full ${goal ? "bg-lime" : "bg-cream/40"}`}
				/>
				{title}
			</p>
			{result ? (
				<ResultsTable result={result} className="min-h-0 flex-1" />
			) : (
				<p className="text-muted-foreground text-xs">
					{goal ? "Loading…" : "Run your query to see its output here."}
				</p>
			)}
		</section>
	);
}

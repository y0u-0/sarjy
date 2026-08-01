import { Button } from "@sarjy-sql/ui/components/button";
import { Play, Send, SkipForward } from "lucide-react";

import { ConfidenceTap } from "@/components/practice/confidence-tap";
import { SqlEditor } from "@/components/sql-editor";
import { EditorHintStrip } from "@/components/teacher/editor-hint-strip";

import type {
	ExerciseWorkspaceActions,
	ExerciseWorkspaceViewModel,
} from "./exercise-workspace-types";

export function ExerciseQuestionHeader({
	lessonTitle,
	title,
	view,
	onSkip,
}: {
	lessonTitle: string;
	title: string;
	view: ExerciseWorkspaceViewModel;
	onSkip: () => void;
}) {
	return (
		<header className="flex shrink-0 items-start justify-between gap-3">
			<div>
				<p className="font-mono text-muted-foreground text-xs">
					{lessonTitle} · Adaptive question
				</p>
				<h1 className="mt-0.5 font-extrabold text-xl tracking-tight">
					{title}
				</h1>
			</div>
			<Button
				variant="ghost"
				className="min-h-11 shrink-0 text-muted-foreground"
				disabled={view.busy !== null || view.recordingAttempt || view.skipping}
				onClick={onSkip}
			>
				<SkipForward data-icon="inline-start" />
				{view.skipping ? "Choosing…" : view.accepted ? "Next" : "Skip"}
			</Button>
		</header>
	);
}

export function ExercisePrompt({ prompt }: { prompt: string }) {
	return (
		<section className="shrink-0 rounded-2xl border border-border bg-card p-4">
			<p className="text-sm leading-relaxed">
				{prompt.split("**").map((part, partIndex) =>
					partIndex % 2 === 1 ? (
						<code
							key={part}
							className="rounded-md bg-lime/15 px-1.5 font-mono text-lime"
						>
							{part}
						</code>
					) : (
						part
					),
				)}
			</p>
		</section>
	);
}

export function ExerciseEditor({
	view,
	actions,
}: {
	view: ExerciseWorkspaceViewModel;
	actions: ExerciseWorkspaceActions;
}) {
	return (
		<section className="shrink-0">
			<div className="relative overflow-hidden rounded-2xl border border-border bg-card">
				<SqlEditor
					value={view.sqlText}
					onChange={actions.changeSql}
					onRun={actions.run}
					readOnly={false}
					tables={view.tables}
					suggestion={view.hintSql}
					onSuggestionResolve={actions.resolveSuggestion}
				/>
				<EditorHintStrip />
			</div>
			<div className="mt-2">
				<ConfidenceTap
					value={view.predicted}
					onChange={actions.setPrediction}
					disabled={view.busy !== null || view.accepted}
				/>
			</div>
			<div className="mt-2 flex items-center gap-2">
				<Button
					onClick={actions.run}
					disabled={view.busy !== null}
					variant="outline"
				>
					<Play data-icon="inline-start" />
					{view.busy === "run" ? "Running…" : "Run"}
				</Button>
				<Button
					onClick={actions.submit}
					disabled={view.busy !== null || view.recordingAttempt}
				>
					<Send data-icon="inline-start" />
					{view.busy === "submit"
						? "Checking…"
						: view.recordingAttempt
							? "Saving…"
							: view.accepted
								? "Test again"
								: "Submit answer"}
				</Button>
				<span className="font-mono text-muted-foreground text-xs">
					{view.accepted
						? "Accepted once · later tests won’t change your profile"
						: "Cmd+Enter runs your query"}
				</span>
			</div>
		</section>
	);
}

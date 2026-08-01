import { SchemaBrowser } from "@/components/schema-browser";

import { ExerciseFeedback, ResultPanels } from "./exercise-feedback";
import {
	ExerciseEditor,
	ExercisePrompt,
	ExerciseQuestionHeader,
} from "./exercise-question-panel";
import type { ExerciseWorkspaceViewProps } from "./exercise-workspace-types";

export function ExerciseWorkspaceView({
	entry,
	workspaceRef,
	view,
	actions,
}: ExerciseWorkspaceViewProps) {
	const { exercise, lesson } = entry;

	return (
		<div
			ref={workspaceRef}
			className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_210px]"
		>
			<div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
				<ExerciseQuestionHeader
					lessonTitle={lesson.title}
					title={exercise.title}
					view={view}
					onSkip={actions.skip}
				/>
				<ExercisePrompt prompt={exercise.prompt} />
				<ExerciseEditor view={view} actions={actions} />
				<ExerciseFeedback
					exerciseId={exercise.id}
					ordered={exercise.ordered}
					view={view}
					actions={actions}
				/>
				<ResultPanels expected={view.expected} result={view.result} />
			</div>

			<aside className="hidden min-h-0 overflow-y-auto border-border border-l p-3 lg:block">
				<p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
					Database
				</p>
				<SchemaBrowser tables={view.tables} />
			</aside>
		</div>
	);
}

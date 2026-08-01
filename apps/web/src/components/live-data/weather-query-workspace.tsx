import { LoaderCircle, LockKeyhole } from "lucide-react";

import type { WeatherLessonState } from "@/lib/live-data/weather-lesson";
import type { TableInfo } from "@/lib/sql-engine/types";

import { SqlEditor } from "../sql-editor";
import { WeatherSubmitBar } from "./weather-submit-bar";

export function WeatherQueryWorkspace({
	lesson,
	querySql,
	tables,
	checking,
	suggestion,
	onQueryChange,
	onCheckQuery,
	onSuggestionResolve,
}: {
	lesson: WeatherLessonState;
	querySql: string;
	tables: TableInfo[];
	checking: boolean;
	suggestion: string | null;
	onQueryChange: (sql: string) => void;
	onCheckQuery: () => void;
	onSuggestionResolve: (accepted: boolean) => void;
}) {
	const unlocked = lesson.prediction !== null;

	return (
		<section className="mt-4 overflow-hidden rounded-[2rem] border border-border bg-card">
			<div className="flex flex-wrap items-center justify-between gap-2 border-border border-b px-4 py-3">
				<div>
					<p className="font-semibold text-sm">Your SQL</p>
					<p className="text-muted-foreground text-xs">
						{unlocked
							? "Cmd/Control + Enter checks this exact query."
							: "Tell Sarjy your prediction to unlock the editor."}
					</p>
				</div>
				{checking && (
					<LoaderCircle className="size-4 animate-spin text-periwinkle" />
				)}
			</div>
			<div className="relative">
				<SqlEditor
					value={querySql}
					onChange={onQueryChange}
					onRun={onCheckQuery}
					tables={tables}
					suggestion={suggestion}
					onSuggestionResolve={onSuggestionResolve}
					readOnly={!unlocked || checking}
					height="220px"
					placeholder={
						unlocked
							? "-- Write your SQL, then submit"
							: "-- Make your prediction first"
					}
				/>
				{!unlocked && (
					<div className="absolute inset-0 flex items-center justify-center bg-ink/75 backdrop-blur-[2px]">
						<p className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-soft px-4 py-2 text-sm">
							<LockKeyhole className="size-4 text-periwinkle" /> Prediction
							first
						</p>
					</div>
				)}
			</div>
			<WeatherSubmitBar
				unlocked={unlocked}
				accepted={lesson.queryPassed}
				checking={checking}
				onSubmit={onCheckQuery}
			/>
		</section>
	);
}

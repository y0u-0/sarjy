import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";

import type { WeatherSurface } from "@/lib/live-data/weather-controller";
import type { WeatherLessonState } from "@/lib/live-data/weather-lesson";
import type {
	QueryPlan,
	SubmitResponse,
	TableInfo,
} from "@/lib/sql-engine/types";

import { LiveDataLessonHeader } from "./live-data-lesson-header";
import { WeatherEvidenceSurface } from "./weather-evidence-surface";
import { WeatherQueryWorkspace } from "./weather-query-workspace";
import {
	DesktopWeatherSchemaPanel,
	MobileWeatherSchemaPanel,
	WeatherSourceAttribution,
} from "./weather-schema-panels";

interface WeatherMissionCanvasProps {
	mission: WeatherMission | null;
	lesson: WeatherLessonState;
	surface: WeatherSurface;
	surfaceNote: string | null;
	querySql: string;
	tables: TableInfo[];
	submission: SubmitResponse | null;
	plan: QueryPlan | null;
	busy: "mission" | "query" | null;
	suggestion: string | null;
	onQueryChange: (sql: string) => void;
	onCheckQuery: () => void;
	onSuggestionResolve: (accepted: boolean) => void;
}

export function WeatherMissionCanvas({
	mission,
	lesson,
	surface,
	surfaceNote,
	querySql,
	tables,
	submission,
	plan,
	busy,
	suggestion,
	onQueryChange,
	onCheckQuery,
	onSuggestionResolve,
}: WeatherMissionCanvasProps) {
	return (
		<div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
			<main className="min-h-0 overflow-y-auto p-4 sm:p-7 lg:p-10">
				<div className="mx-auto max-w-5xl pb-28">
					<LiveDataLessonHeader />
					{mission && <MobileWeatherSchemaPanel tables={tables} />}

					<div className="mt-8 rounded-[2rem] border border-border bg-card p-5 sm:p-7">
						<WeatherEvidenceSurface
							mission={mission}
							lesson={lesson}
							surface={surface}
							note={surfaceNote}
							submission={submission}
							plan={plan}
							loadingMission={busy === "mission"}
						/>
					</div>

					{mission && (
						<WeatherQueryWorkspace
							lesson={lesson}
							querySql={querySql}
							tables={tables}
							checking={busy === "query"}
							suggestion={suggestion}
							onQueryChange={onQueryChange}
							onCheckQuery={onCheckQuery}
							onSuggestionResolve={onSuggestionResolve}
						/>
					)}

					{mission && <WeatherSourceAttribution mission={mission} />}
				</div>
			</main>

			{mission && <DesktopWeatherSchemaPanel tables={tables} />}
		</div>
	);
}

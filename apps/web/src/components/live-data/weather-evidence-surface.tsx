import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";

import type { WeatherSurface } from "@/lib/live-data/weather-controller";
import type { WeatherLessonState } from "@/lib/live-data/weather-lesson";
import type { QueryPlan, SubmitResponse } from "@/lib/sql-engine/types";

import {
	EmptyWeatherMission,
	WeatherDataSurface,
	WeatherQuestionSurface,
} from "./weather-mission-surfaces";
import {
	WeatherChartSurface,
	WeatherPlanSurface,
	WeatherResultSurface,
} from "./weather-review-surfaces";

export function WeatherEvidenceSurface({
	mission,
	lesson,
	surface,
	note,
	submission,
	plan,
	loadingMission,
}: {
	mission: WeatherMission | null;
	lesson: WeatherLessonState;
	surface: WeatherSurface;
	note: string | null;
	submission: SubmitResponse | null;
	plan: QueryPlan | null;
	loadingMission: boolean;
}) {
	if (!mission) return <EmptyWeatherMission loading={loadingMission} />;
	if (surface === "question") {
		return (
			<WeatherQuestionSurface mission={mission} lesson={lesson} note={note} />
		);
	}
	if (surface === "data") {
		return <WeatherDataSurface mission={mission} note={note} />;
	}
	if (surface === "chart") {
		return <WeatherChartSurface mission={mission} note={note} />;
	}
	if (surface === "result") {
		return <WeatherResultSurface submission={submission} note={note} />;
	}
	return <WeatherPlanSurface plan={plan} note={note} />;
}

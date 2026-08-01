import type {
	WeatherMission,
	WeatherMissionFocus,
} from "@sarjy-sql/api/lib/weather-mission";
import { WEATHER_MISSION_FOCUS } from "@sarjy-sql/api/lib/weather-mission";

import { WEATHER_BLOCKED_PREFIX } from "@/lib/live-data/weather-controller";
import type { WeatherLessonState } from "@/lib/live-data/weather-lesson";
import type { SubmitResponse } from "@/lib/sql-engine/types";

export const DEFAULT_LIVE_DATA_SQL = `-- Write the query Sarjy asked for
SELECT`;

export function isWeatherMissionFocus(
	value: string,
): value is WeatherMissionFocus {
	return WEATHER_MISSION_FOCUS.some((focus) => focus === value);
}

export function weatherBlocked(message: string): string {
	return `${WEATHER_BLOCKED_PREFIX} ${message}`;
}

export function previewQueryResult(response: SubmitResponse): string {
	const rows = response.result.rows
		.slice(0, 3)
		.map((row) => JSON.stringify(row));
	return rows.length > 0 ? rows.join("; ") : "no rows";
}

export function describeLiveDataSession({
	mission,
	lesson,
	surface,
	querySql,
}: {
	mission: WeatherMission | null;
	lesson: WeatherLessonState;
	surface: string;
	querySql: string;
}): string {
	if (!mission) {
		return "No mission exists. Ask the learner to name one to three cities, then choose a focus from foundations, aggregation, or windows based on their learner brief.";
	}
	return [
		`Mission: ${mission.challenge.title} (${mission.id}).`,
		`Checkpoint: ${lesson.checkpoint}. Visible surface: ${surface}.`,
		`Prompt: ${mission.challenge.prompt}`,
		`Prediction: ${lesson.prediction ?? "not recorded"}.`,
		`Editor: ${querySql.trim() || "empty"}.`,
		"Available evidence after its gate: data, chart, result, plan.",
	].join("\n");
}

export function liveDataScreenSummary(
	mission: WeatherMission | null,
	lesson: WeatherLessonState,
): string {
	return mission
		? `Agent-controlled live-data SQL mission ${mission.id}. ${mission.challenge.prompt} Schema: ${mission.schemaSummary} Current checkpoint: ${lesson.checkpoint}. The reference answer is intentionally hidden.`
		: "Agent-controlled live-data lesson. Ask the learner to name one to three cities they care about. Choose foundations, aggregation, or windows from the learner brief, then call weather_create_mission. Do not invent or preload a city.";
}

import { expect, test } from "bun:test";
import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";

import { createWeatherLesson } from "@/lib/live-data/weather-lesson";

import {
	DEFAULT_LIVE_DATA_SQL,
	describeLiveDataSession,
	isWeatherMissionFocus,
	liveDataScreenSummary,
	weatherBlocked,
} from "./live-data-session-model";

const mission = {
	id: "weather_test",
	schemaSummary: "locations and weather_hourly",
	challenge: {
		title: "Hottest hours",
		prompt: "Find the hottest hours.",
	},
} as WeatherMission;

test("recognizes only authored mission focus values", () => {
	expect(isWeatherMissionFocus("foundations")).toBe(true);
	expect(isWeatherMissionFocus("aggregation")).toBe(true);
	expect(isWeatherMissionFocus("windows")).toBe(true);
	expect(isWeatherMissionFocus("joins")).toBe(false);
});

test("describes one authoritative live-data session to the teacher", () => {
	const lesson = {
		...createWeatherLesson(),
		missionId: mission.id,
		checkpoint: "query" as const,
		prediction: "Riyadh will be hottest",
	};
	const description = describeLiveDataSession({
		mission,
		lesson,
		surface: "question",
		querySql: DEFAULT_LIVE_DATA_SQL,
	});

	expect(description).toContain("Checkpoint: query");
	expect(description).toContain("Riyadh will be hottest");
	expect(liveDataScreenSummary(mission, lesson)).toContain(
		"reference answer is intentionally hidden",
	);
	expect(weatherBlocked("Predict first.")).toBe("BLOCKED: Predict first.");
});

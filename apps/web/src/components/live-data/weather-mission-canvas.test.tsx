import { expect, test } from "bun:test";
import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";
import { renderToStaticMarkup } from "react-dom/server";

import { createWeatherLesson } from "@/lib/live-data/weather-lesson";
import type { TableInfo } from "@/lib/sql-engine/types";

import { WeatherMissionCanvas } from "./weather-mission-canvas";

const mission: WeatherMission = {
	id: "weather_test",
	generatedAt: "2026-08-01T12:00:00.000Z",
	period: { startDate: "2026-07-18", endDate: "2026-07-24", days: 7 },
	locations: [
		{
			id: 1,
			city: "Riyadh",
			country: "Saudi Arabia",
			countryCode: "SA",
			latitude: 24.6877,
			longitude: 46.7219,
			timezone: "Asia/Riyadh",
		},
	],
	observationCount: 168,
	schemaSql: "",
	schemaSummary: "weather schema",
	challenge: {
		id: "hottest",
		title: "The hottest hours",
		prompt: "Find the hottest hours.",
		concept: "filtering-sorting",
		referenceSql: "SELECT 1",
		ordered: true,
		predictionPrompt: "Which hour will be hottest?",
	},
	chartRows: [],
	previewRows: [],
	source: {
		name: "Open-Meteo Historical Weather API",
		url: "https://open-meteo.com/en/docs/historical-weather-api",
		dataKind: "modeled historical weather",
	},
};

const tables: TableInfo[] = [
	{
		name: "locations",
		rowCount: 1,
		columns: [{ name: "id", type: "INTEGER" }],
	},
	{
		name: "weather_hourly",
		rowCount: 168,
		columns: [{ name: "location_id", type: "INTEGER" }],
	},
	{
		name: "weather_snapshot",
		rowCount: 1,
		columns: [{ name: "id", type: "TEXT" }],
	},
];

test("keeps the database guide and submission action visible beside a live mission", () => {
	const html = renderToStaticMarkup(
		<WeatherMissionCanvas
			mission={mission}
			lesson={{
				...createWeatherLesson(),
				missionId: mission.id,
				checkpoint: "predict",
			}}
			surface="question"
			surfaceNote={null}
			querySql="SELECT"
			tables={tables}
			submission={null}
			plan={null}
			busy={null}
			suggestion={null}
			onQueryChange={() => {}}
			onCheckQuery={() => {}}
			onSuggestionResolve={() => {}}
		/>,
	);

	expect(html).toContain('aria-label="Database schema"');
	expect(html).toContain('data-live-data-surface="question"');
	expect(html).toContain("Database · 3 tables");
	expect(html).toContain("Submit answer");
	expect(html).toContain("Make your prediction to unlock submission");
});

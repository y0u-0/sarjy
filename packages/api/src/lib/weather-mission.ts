import { naturalList, weatherChallenge } from "./weather-mission-challenge";
import { weatherChartRows } from "./weather-mission-chart";
import { loadWeatherSnapshot, normalizeCities } from "./weather-mission-source";
import {
	buildWeatherSchemaSql,
	WEATHER_SOURCE_URL,
} from "./weather-mission-sql";
import type {
	WeatherMission,
	WeatherMissionDependencies,
	WeatherMissionInput,
} from "./weather-mission-types";
import {
	WEATHER_MISSION_FOCUS,
	WeatherMissionError,
} from "./weather-mission-types";

export type {
	WeatherChartRow,
	WeatherMission,
	WeatherMissionChallenge,
	WeatherMissionFetch,
	WeatherMissionFocus,
	WeatherMissionInput,
	WeatherMissionLocation,
	WeatherPreviewRow,
} from "./weather-mission-types";
export {
	WEATHER_MISSION_FOCUS,
	WeatherMissionError,
} from "./weather-mission-types";

const DATA_LAG_DAYS = 7;

function utcDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 86_400_000);
}

export async function createWeatherMission(
	input: WeatherMissionInput,
	dependencies: WeatherMissionDependencies = {},
): Promise<WeatherMission> {
	const cities = normalizeCities(input.cities);
	if (!Number.isInteger(input.days) || input.days < 7 || input.days > 30) {
		throw new WeatherMissionError(
			"invalid-input",
			"A weather mission must cover between 7 and 30 whole days.",
		);
	}
	if (!WEATHER_MISSION_FOCUS.includes(input.focus)) {
		throw new WeatherMissionError(
			"invalid-input",
			"Choose foundations, aggregation, or windows as the mission focus.",
		);
	}

	const fetcher = dependencies.fetcher ?? fetch;
	const now = dependencies.now?.() ?? new Date();
	const end = addUtcDays(now, -DATA_LAG_DAYS);
	const start = addUtcDays(end, -(input.days - 1));
	const period = {
		startDate: utcDate(start),
		endDate: utcDate(end),
		days: input.days,
	};
	const { locations, observations } = await loadWeatherSnapshot(
		cities,
		period,
		fetcher,
	);
	const generatedAt = now.toISOString();
	const missionId =
		dependencies.createId?.() ?? `weather_${crypto.randomUUID()}`;
	const cityNames = locations.map((location) => location.city);

	return {
		id: missionId,
		generatedAt,
		period,
		locations,
		observationCount: observations.length,
		schemaSql: buildWeatherSchemaSql(
			missionId,
			generatedAt,
			period,
			locations,
			observations,
		),
		schemaSummary: `locations(id, city, country, country_code, latitude, longitude, timezone) — ${locations.length} rows; weather_hourly(id, location_id, observed_at, temperature_c, humidity_pct, precipitation_mm, wind_kmh) — ${observations.length.toLocaleString()} rows covering ${naturalList(cityNames)} from ${period.startDate} through ${period.endDate}.`,
		challenge: weatherChallenge(input.focus, locations),
		chartRows: weatherChartRows(locations, observations),
		previewRows: observations.slice(0, 8).map((row) => ({
			city: row.city,
			observedAt: row.observedAt,
			temperatureC: row.temperatureC,
			humidityPct: row.humidityPct,
			precipitationMm: row.precipitationMm,
			windKmh: row.windKmh,
		})),
		source: {
			name: "Open-Meteo Historical Weather API",
			url: WEATHER_SOURCE_URL,
			dataKind: "modeled historical weather",
		},
	};
}

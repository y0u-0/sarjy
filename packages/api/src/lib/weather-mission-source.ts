import { z } from "zod";

import type {
	WeatherMissionFetch,
	WeatherMissionLocation,
	WeatherObservation,
} from "./weather-mission-types";
import { WeatherMissionError } from "./weather-mission-types";

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const ARCHIVE_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";
const REQUEST_TIMEOUT_MS = 8_000;

const geocodingResponseSchema = z.object({
	results: z
		.array(
			z.object({
				id: z.number(),
				name: z.string().min(1),
				country: z.string().min(1),
				country_code: z.string().length(2),
				latitude: z.number().finite(),
				longitude: z.number().finite(),
				timezone: z.string().min(1),
			}),
		)
		.optional(),
});
const nullableReading = z.number().finite().nullable();
const historicalResponseSchema = z.object({
	hourly: z.object({
		time: z.array(z.string().min(1)),
		temperature_2m: z.array(nullableReading),
		relative_humidity_2m: z.array(nullableReading),
		precipitation: z.array(nullableReading),
		wind_speed_10m: z.array(nullableReading),
	}),
});

export function normalizeCities(cities: readonly string[]): string[] {
	const unique = new Map<string, string>();
	for (const value of cities) {
		const city = value.trim().replace(/\s+/g, " ");
		if (!city) continue;
		if (city.length < 2 || city.length > 80) {
			throw new WeatherMissionError(
				"invalid-input",
				"Each city must be between 2 and 80 characters.",
			);
		}
		const key = city.toLocaleLowerCase("en");
		if (!unique.has(key)) unique.set(key, city);
	}
	const result = [...unique.values()];
	if (result.length < 1 || result.length > 3) {
		throw new WeatherMissionError(
			"invalid-input",
			"Choose between one and three distinct cities.",
		);
	}
	return result;
}

async function fetchJson(
	fetcher: WeatherMissionFetch,
	url: URL,
): Promise<unknown> {
	let response: Response;
	try {
		response = await fetcher(url, {
			headers: { accept: "application/json" },
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
	} catch {
		throw new WeatherMissionError(
			"upstream-unavailable",
			"The live weather source did not respond. Please try again.",
		);
	}
	if (!response.ok) {
		throw new WeatherMissionError(
			"upstream-unavailable",
			`The live weather source returned HTTP ${response.status}. Please try again.`,
		);
	}
	try {
		return await response.json();
	} catch {
		throw new WeatherMissionError(
			"invalid-upstream-data",
			"The live weather source returned an unreadable response.",
		);
	}
}

async function resolveLocation(
	city: string,
	index: number,
	fetcher: WeatherMissionFetch,
): Promise<WeatherMissionLocation> {
	const url = new URL(GEOCODING_ENDPOINT);
	url.searchParams.set("name", city);
	url.searchParams.set("count", "1");
	url.searchParams.set("language", "en");
	url.searchParams.set("format", "json");
	const parsed = geocodingResponseSchema.safeParse(
		await fetchJson(fetcher, url),
	);
	if (!parsed.success) {
		throw new WeatherMissionError(
			"invalid-upstream-data",
			"The location service returned data in an unexpected format.",
		);
	}
	const result = parsed.data.results?.[0];
	if (!result)
		throw new WeatherMissionError(
			"location-not-found",
			`I could not find a city matching “${city}”.`,
		);
	return {
		id: index + 1,
		city: result.name,
		country: result.country,
		countryCode: result.country_code,
		latitude: result.latitude,
		longitude: result.longitude,
		timezone: result.timezone,
	};
}

async function loadObservations(
	location: WeatherMissionLocation,
	period: { startDate: string; endDate: string },
	fetcher: WeatherMissionFetch,
): Promise<Omit<WeatherObservation, "id">[]> {
	const url = new URL(ARCHIVE_ENDPOINT);
	url.searchParams.set("latitude", String(location.latitude));
	url.searchParams.set("longitude", String(location.longitude));
	url.searchParams.set("start_date", period.startDate);
	url.searchParams.set("end_date", period.endDate);
	url.searchParams.set("timezone", location.timezone);
	url.searchParams.set(
		"hourly",
		"temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
	);
	const parsed = historicalResponseSchema.safeParse(
		await fetchJson(fetcher, url),
	);
	if (!parsed.success)
		throw new WeatherMissionError(
			"invalid-upstream-data",
			`The weather source returned an unexpected series for ${location.city}.`,
		);
	const { hourly } = parsed.data;
	const expected = hourly.time.length;
	const lengths = [
		hourly.temperature_2m.length,
		hourly.relative_humidity_2m.length,
		hourly.precipitation.length,
		hourly.wind_speed_10m.length,
	];
	if (expected === 0 || lengths.some((length) => length !== expected)) {
		throw new WeatherMissionError(
			"invalid-upstream-data",
			`The weather series for ${location.city} was incomplete.`,
		);
	}
	return hourly.time.map((observedAt, index) => ({
		locationId: location.id,
		city: location.city,
		observedAt,
		temperatureC: hourly.temperature_2m[index] ?? null,
		humidityPct: hourly.relative_humidity_2m[index] ?? null,
		precipitationMm: hourly.precipitation[index] ?? null,
		windKmh: hourly.wind_speed_10m[index] ?? null,
	}));
}

export async function loadWeatherSnapshot(
	cities: string[],
	period: { startDate: string; endDate: string },
	fetcher: WeatherMissionFetch,
) {
	const locations = await Promise.all(
		cities.map((city, index) => resolveLocation(city, index, fetcher)),
	);
	const perLocation = await Promise.all(
		locations.map((location) => loadObservations(location, period, fetcher)),
	);
	let observationId = 0;
	return {
		locations,
		observations: perLocation.flatMap((rows) =>
			rows.map((row) => ({ ...row, id: ++observationId })),
		),
	};
}

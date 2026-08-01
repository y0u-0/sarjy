export const WEATHER_MISSION_FOCUS = [
	"foundations",
	"aggregation",
	"windows",
] as const;
export type WeatherMissionFocus = (typeof WEATHER_MISSION_FOCUS)[number];
export type WeatherMissionFetch = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

export interface WeatherMissionInput {
	cities: string[];
	days: number;
	focus: WeatherMissionFocus;
}

export interface WeatherMissionLocation {
	id: number;
	city: string;
	country: string;
	countryCode: string;
	latitude: number;
	longitude: number;
	timezone: string;
}

export interface WeatherObservation {
	id: number;
	locationId: number;
	city: string;
	observedAt: string;
	temperatureC: number | null;
	humidityPct: number | null;
	precipitationMm: number | null;
	windKmh: number | null;
}

export interface WeatherChartRow {
	city: string;
	day: string;
	averageTemperatureC: number;
	precipitationMm: number;
}

export interface WeatherPreviewRow {
	city: string;
	observedAt: string;
	temperatureC: number | null;
	humidityPct: number | null;
	precipitationMm: number | null;
	windKmh: number | null;
}

export interface WeatherMissionChallenge {
	id: string;
	title: string;
	prompt: string;
	concept: string;
	referenceSql: string;
	ordered: boolean;
	predictionPrompt: string;
}

export interface WeatherMission {
	id: string;
	generatedAt: string;
	period: { startDate: string; endDate: string; days: number };
	locations: WeatherMissionLocation[];
	observationCount: number;
	schemaSql: string;
	schemaSummary: string;
	challenge: WeatherMissionChallenge;
	chartRows: WeatherChartRow[];
	previewRows: WeatherPreviewRow[];
	source: {
		name: "Open-Meteo Historical Weather API";
		url: "https://open-meteo.com/en/docs/historical-weather-api";
		dataKind: "modeled historical weather";
	};
}

export interface WeatherMissionDependencies {
	fetcher?: WeatherMissionFetch;
	now?: () => Date;
	createId?: () => string;
}

export class WeatherMissionError extends Error {
	constructor(
		public readonly kind:
			| "invalid-input"
			| "location-not-found"
			| "upstream-unavailable"
			| "invalid-upstream-data",
		message: string,
	) {
		super(message);
		this.name = "WeatherMissionError";
	}
}

import type {
	WeatherMissionLocation,
	WeatherObservation,
} from "./weather-mission-types";

export const WEATHER_SOURCE_URL =
	"https://open-meteo.com/en/docs/historical-weather-api" as const;

function sqlText(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

function sqlReading(value: number | null): string {
	return value === null ? "NULL" : String(value);
}

export function buildWeatherSchemaSql(
	missionId: string,
	generatedAt: string,
	period: { startDate: string; endDate: string },
	locations: readonly WeatherMissionLocation[],
	observations: readonly WeatherObservation[],
): string {
	const locationValues = locations
		.map(
			(location) =>
				`(${location.id}, ${sqlText(location.city)}, ${sqlText(location.country)}, ${sqlText(location.countryCode)}, ${location.latitude}, ${location.longitude}, ${sqlText(location.timezone)})`,
		)
		.join(",\n  ");
	const observationValues = observations
		.map(
			(observation) =>
				`(${observation.id}, ${observation.locationId}, ${sqlText(observation.observedAt)}, ${sqlReading(observation.temperatureC)}, ${sqlReading(observation.humidityPct)}, ${sqlReading(observation.precipitationMm)}, ${sqlReading(observation.windKmh)})`,
		)
		.join(",\n  ");

	return `
CREATE TABLE weather_snapshot (
  id TEXT PRIMARY KEY,
  generated_at TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  data_kind TEXT NOT NULL
);

CREATE TABLE locations (
  id INTEGER PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  timezone TEXT NOT NULL
);

CREATE TABLE weather_hourly (
  id INTEGER PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  observed_at TEXT NOT NULL,
  temperature_c REAL,
  humidity_pct REAL,
  precipitation_mm REAL,
  wind_kmh REAL
);

INSERT INTO weather_snapshot VALUES (
  ${sqlText(missionId)}, ${sqlText(generatedAt)}, ${sqlText(period.startDate)},
  ${sqlText(period.endDate)}, 'Open-Meteo Historical Weather API',
  ${sqlText(WEATHER_SOURCE_URL)}, 'modeled historical weather'
);

INSERT INTO locations
  (id, city, country, country_code, latitude, longitude, timezone)
VALUES
  ${locationValues};

INSERT INTO weather_hourly
  (id, location_id, observed_at, temperature_c, humidity_pct, precipitation_mm, wind_kmh)
VALUES
  ${observationValues};
`;
}

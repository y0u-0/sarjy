import type {
	WeatherMissionChallenge,
	WeatherMissionFocus,
	WeatherMissionLocation,
} from "./weather-mission-types";

export function naturalList(values: readonly string[]): string {
	if (values.length === 1) return values[0] as string;
	if (values.length === 2) return `${values[0]} and ${values[1]}`;
	return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

export function weatherChallenge(
	focus: WeatherMissionFocus,
	locations: readonly WeatherMissionLocation[],
): WeatherMissionChallenge {
	const cities = naturalList(locations.map((location) => location.city));
	if (focus === "foundations") {
		return {
			id: "live-weather-hottest-hours",
			title: "The hottest hours",
			prompt: `Using the modeled weather snapshot for ${cities}, return the five hottest observations. Show city, observed_at, and temperature_c; order hottest first, then earlier timestamps first for ties.`,
			concept: "filtering-sorting",
			referenceSql: `SELECT l.city, w.observed_at, w.temperature_c
FROM weather_hourly w
JOIN locations l ON l.id = w.location_id
ORDER BY w.temperature_c DESC, w.observed_at ASC
LIMIT 5`,
			ordered: true,
			predictionPrompt:
				"Before querying, which city do you expect to own the hottest observation?",
		};
	}
	if (focus === "windows") {
		return {
			id: "live-weather-moving-average",
			title: "Three-day temperature trend",
			prompt: `Using ${cities}, calculate each city's daily average temperature and a three-day moving average. Return city, day, average_temperature_c, and moving_average_c in city and day order.`,
			concept: "window-analytics",
			referenceSql: `WITH daily AS (
  SELECT
    l.city,
    DATE(w.observed_at) AS day,
    ROUND(AVG(w.temperature_c), 1) AS average_temperature_c
  FROM weather_hourly w
  JOIN locations l ON l.id = w.location_id
  GROUP BY l.city, DATE(w.observed_at)
)
SELECT
  city,
  day,
  average_temperature_c,
  ROUND(AVG(average_temperature_c) OVER (
    PARTITION BY city
    ORDER BY day
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ), 1) AS moving_average_c
FROM daily
ORDER BY city, day`,
			ordered: true,
			predictionPrompt:
				"Which city do you expect to have the smoother three-day trend, and why?",
		};
	}
	return {
		id: "live-weather-city-summary",
		title: "Compare the cities",
		prompt: `For ${cities}, return one row per city with average_temperature_c and total_precipitation_mm, each rounded to one decimal place. Order by city.`,
		concept: "advanced-aggregation",
		referenceSql: `SELECT
  l.city,
  ROUND(AVG(w.temperature_c), 1) AS average_temperature_c,
  ROUND(SUM(w.precipitation_mm), 1) AS total_precipitation_mm
FROM weather_hourly w
JOIN locations l ON l.id = w.location_id
GROUP BY l.city
ORDER BY l.city`,
		ordered: true,
		predictionPrompt:
			"Before calculating, which city do you expect to be hotter on average?",
	};
}

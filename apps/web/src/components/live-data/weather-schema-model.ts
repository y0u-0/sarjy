import type { TableInfo } from "@/lib/sql-engine/types";

export interface WeatherColumnGuide {
	description: string;
	key?: "Primary key" | "Foreign key";
}

export interface WeatherTableGuide {
	purpose: string;
	rowMeaning: string;
	columns: Record<string, WeatherColumnGuide>;
}

export const WEATHER_TABLE_GUIDES: Record<string, WeatherTableGuide> = {
	locations: {
		purpose: "The places selected for this lesson.",
		rowMeaning: "One row = one city",
		columns: {
			id: { description: "City identifier", key: "Primary key" },
			city: { description: "City name" },
			country: { description: "Country name" },
			country_code: { description: "Two-letter country code" },
			latitude: { description: "North–south position · degrees" },
			longitude: { description: "East–west position · degrees" },
			timezone: { description: "Local time zone" },
		},
	},
	weather_hourly: {
		purpose: "The modeled weather readings you can analyze.",
		rowMeaning: "One row = one modeled hour for one city",
		columns: {
			id: { description: "Reading identifier", key: "Primary key" },
			location_id: {
				description: "City this reading belongs to",
				key: "Foreign key",
			},
			observed_at: { description: "Observation date and hour" },
			temperature_c: { description: "Temperature · °C" },
			humidity_pct: { description: "Relative humidity · %" },
			precipitation_mm: { description: "Precipitation · mm" },
			wind_kmh: { description: "Wind speed · km/h" },
		},
	},
	weather_snapshot: {
		purpose: "Where this frozen lesson came from.",
		rowMeaning: "One row = this lesson's data snapshot",
		columns: {
			id: { description: "Snapshot identifier", key: "Primary key" },
			generated_at: { description: "When the lesson was created" },
			start_date: { description: "First date included" },
			end_date: { description: "Last date included" },
			source_name: { description: "Data provider" },
			source_url: { description: "Provider documentation" },
			data_kind: { description: "What kind of data this is" },
		},
	},
};

const TABLE_ORDER = ["locations", "weather_hourly", "weather_snapshot"];

export function organizeWeatherTables(tables: TableInfo[]) {
	const order = new Map(TABLE_ORDER.map((name, index) => [name, index]));
	const ordered = [...tables].sort(
		(left, right) =>
			(order.get(left.name) ?? TABLE_ORDER.length) -
			(order.get(right.name) ?? TABLE_ORDER.length),
	);
	return {
		locations: ordered.find((table) => table.name === "locations"),
		hourly: ordered.find((table) => table.name === "weather_hourly"),
		snapshot: ordered.find((table) => table.name === "weather_snapshot"),
		extras: ordered.filter((table) => !TABLE_ORDER.includes(table.name)),
	};
}

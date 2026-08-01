import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { TableInfo } from "@/lib/sql-engine/types";

import { WeatherSchemaGuide } from "./weather-schema-guide";

const tables: TableInfo[] = [
	{
		name: "weather_snapshot",
		rowCount: 1,
		columns: [
			{ name: "id", type: "TEXT" },
			{ name: "generated_at", type: "TEXT" },
			{ name: "start_date", type: "TEXT" },
			{ name: "end_date", type: "TEXT" },
			{ name: "source_name", type: "TEXT" },
			{ name: "source_url", type: "TEXT" },
			{ name: "data_kind", type: "TEXT" },
		],
	},
	{
		name: "locations",
		rowCount: 2,
		columns: [
			{ name: "id", type: "INTEGER" },
			{ name: "city", type: "TEXT" },
			{ name: "country", type: "TEXT" },
			{ name: "country_code", type: "TEXT" },
			{ name: "latitude", type: "REAL" },
			{ name: "longitude", type: "REAL" },
			{ name: "timezone", type: "TEXT" },
		],
	},
	{
		name: "weather_hourly",
		rowCount: 336,
		columns: [
			{ name: "id", type: "INTEGER" },
			{ name: "location_id", type: "INTEGER" },
			{ name: "observed_at", type: "TEXT" },
			{ name: "temperature_c", type: "REAL" },
			{ name: "humidity_pct", type: "REAL" },
			{ name: "precipitation_mm", type: "REAL" },
			{ name: "wind_kmh", type: "REAL" },
		],
	},
];

test("explains every live-data table and the join in normal challenge language", () => {
	const html = renderToStaticMarkup(<WeatherSchemaGuide tables={tables} />);

	expect(html).toContain("Database");
	expect(html).toContain("locations");
	expect(html).toContain("weather_hourly");
	expect(html).toContain("weather_snapshot");
	expect(html).toContain("One row = one city");
	expect(html).toContain("One row = one modeled hour for one city");
	expect(html).toContain("locations.id = weather_hourly.location_id");
	expect(html).toContain("336 rows");
	expect(html).toContain("Temperature · °C");
	expect(html).toContain("Foreign key");
});

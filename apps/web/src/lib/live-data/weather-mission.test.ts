import { describe, expect, test } from "bun:test";
import {
	createWeatherMission,
	type WeatherMissionFetch,
	type WeatherMissionFocus,
} from "@sarjy-sql/api/lib/weather-mission";
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

describe("weather mission SQLite snapshot", () => {
	test("executes every authored challenge over safely escaped external data", async () => {
		const fetcher: WeatherMissionFetch = async (input) => {
			const url = String(input);
			if (url.includes("geocoding-api")) {
				return Response.json({
					results: [
						{
							id: 1,
							name: "St. John's",
							country: "Canada",
							country_code: "CA",
							latitude: 47.56,
							longitude: -52.71,
							timezone: "America/St_Johns",
						},
					],
				});
			}
			return Response.json({
				hourly: {
					time: [
						"2026-07-19T00:00",
						"2026-07-19T12:00",
						"2026-07-20T00:00",
						"2026-07-20T12:00",
					],
					temperature_2m: [12, 18, 14, 20],
					relative_humidity_2m: [80, 70, 78, 68],
					precipitation: [0.2, 0, 1.1, 0],
					wind_speed_10m: [12, 9, 18, 10],
				},
			});
		};
		const sqlite3 = await sqlite3InitModule();

		for (const focus of [
			"foundations",
			"aggregation",
			"windows",
		] satisfies WeatherMissionFocus[]) {
			const mission = await createWeatherMission(
				{ cities: ["St. John's"], days: 7, focus },
				{
					fetcher,
					now: () => new Date("2026-07-27T12:00:00.000Z"),
					createId: () => `snapshot_${focus}`,
				},
			);
			const db = new sqlite3.oo1.DB(":memory:");
			try {
				db.exec(mission.schemaSql);
				let resultRows = 0;
				db.exec({
					sql: mission.challenge.referenceSql,
					callback: () => {
						resultRows += 1;
					},
				});
				expect(resultRows).toBeGreaterThan(0);
			} finally {
				db.close();
			}
		}
	});
});

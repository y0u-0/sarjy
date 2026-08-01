import { describe, expect, test } from "bun:test";

import {
	createWeatherMission,
	type WeatherMissionFetch,
} from "./weather-mission";

describe("live weather mission", () => {
	test("turns named cities into one frozen, attributed SQL mission", async () => {
		const requestedUrls: string[] = [];
		const fetcher: WeatherMissionFetch = async (input) => {
			const url = String(input);
			requestedUrls.push(url);
			if (url.includes("geocoding-api")) {
				const city = new URL(url).searchParams.get("name");
				return Response.json({
					results: [
						city === "Riyadh"
							? {
									id: 1,
									name: "Riyadh",
									country: "Saudi Arabia",
									country_code: "SA",
									latitude: 24.6877,
									longitude: 46.7219,
									timezone: "Asia/Riyadh",
								}
							: {
									id: 2,
									name: "Dubai",
									country: "United Arab Emirates",
									country_code: "AE",
									latitude: 25.2048,
									longitude: 55.2708,
									timezone: "Asia/Dubai",
								},
					],
				});
			}

			const latitude = Number(new URL(url).searchParams.get("latitude"));
			return Response.json({
				latitude,
				longitude: latitude === 24.6877 ? 46.7219 : 55.2708,
				timezone: latitude === 24.6877 ? "Asia/Riyadh" : "Asia/Dubai",
				hourly: {
					time: ["2026-07-19T00:00", "2026-07-19T01:00", "2026-07-20T00:00"],
					temperature_2m:
						latitude === 24.6877 ? [34, 35, 36] : [null, null, 33],
					relative_humidity_2m: [20, 21, 22],
					precipitation: [0, 0, 0.2],
					wind_speed_10m: [8, 9, 10],
				},
			});
		};

		const mission = await createWeatherMission(
			{
				cities: [" Riyadh ", "Dubai", "riyadh"],
				days: 7,
				focus: "aggregation",
			},
			{
				fetcher,
				now: () => new Date("2026-07-27T12:00:00.000Z"),
				createId: () => "weather_test_snapshot",
			},
		);

		expect(requestedUrls).toHaveLength(4);
		expect(mission.id).toBe("weather_test_snapshot");
		expect(mission.generatedAt).toBe("2026-07-27T12:00:00.000Z");
		expect(mission.period).toEqual({
			startDate: "2026-07-14",
			endDate: "2026-07-20",
			days: 7,
		});
		expect(mission.locations.map((location) => location.city)).toEqual([
			"Riyadh",
			"Dubai",
		]);
		expect(mission.observationCount).toBe(6);
		expect(mission.schemaSql).toContain("CREATE TABLE weather_hourly");
		expect(mission.schemaSql).toContain("'Asia/Riyadh'");
		expect(mission.challenge.prompt).toContain("Riyadh and Dubai");
		expect(mission.challenge.referenceSql).toContain("GROUP BY l.city");
		expect(mission.chartRows).toHaveLength(3);
		expect(
			mission.chartRows.some(
				(row) => row.city === "Dubai" && row.day === "2026-07-19",
			),
		).toBe(false);
		expect(mission.source).toEqual({
			name: "Open-Meteo Historical Weather API",
			url: "https://open-meteo.com/en/docs/historical-weather-api",
			dataKind: "modeled historical weather",
		});
	});
});

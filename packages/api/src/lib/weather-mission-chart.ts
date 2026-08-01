import type {
	WeatherChartRow,
	WeatherMissionLocation,
	WeatherObservation,
} from "./weather-mission-types";

export function weatherChartRows(
	locations: readonly WeatherMissionLocation[],
	observations: readonly WeatherObservation[],
): WeatherChartRow[] {
	const groups = new Map<
		string,
		{ city: string; day: string; temperatures: number[]; precipitation: number }
	>();
	for (const observation of observations) {
		const day = observation.observedAt.slice(0, 10);
		const key = `${observation.locationId}:${day}`;
		const group = groups.get(key) ?? {
			city: observation.city,
			day,
			temperatures: [],
			precipitation: 0,
		};
		if (observation.temperatureC !== null) {
			group.temperatures.push(observation.temperatureC);
		}
		group.precipitation += observation.precipitationMm ?? 0;
		groups.set(key, group);
	}
	const cityOrder = new Map(
		locations.map((location, index) => [location.city, index]),
	);
	return [...groups.values()]
		.filter((group) => group.temperatures.length > 0)
		.map((group) => ({
			city: group.city,
			day: group.day,
			averageTemperatureC: Number(
				(
					group.temperatures.reduce((sum, value) => sum + value, 0) /
					group.temperatures.length
				).toFixed(1),
			),
			precipitationMm: Number(group.precipitation.toFixed(1)),
		}))
		.sort(
			(a, b) =>
				(cityOrder.get(a.city) ?? 0) - (cityOrder.get(b.city) ?? 0) ||
				a.day.localeCompare(b.day),
		);
}

import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { WeatherTrendChart } from "./weather-trend-chart";

test("renders an accessible TanStack chart with exact-value fallback and attribution", () => {
	const html = renderToStaticMarkup(
		<WeatherTrendChart
			rows={[
				{
					city: "Riyadh",
					day: "2026-07-19",
					averageTemperatureC: 35.2,
					precipitationMm: 0,
				},
				{
					city: "Dubai",
					day: "2026-07-19",
					averageTemperatureC: 33.8,
					precipitationMm: 0.2,
				},
			]}
			startDate="2026-07-19"
			endDate="2026-07-19"
		/>,
	);

	expect(html).toContain('data-chart-engine="tanstack-charts"');
	expect(html).toContain("Daily average temperature");
	expect(html).toContain("Riyadh");
	expect(html).toContain("35.2°C");
	expect(html).toContain("Open-Meteo");
});

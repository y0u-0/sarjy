import type { WeatherChartRow } from "@sarjy-sql/api/lib/weather-mission";
import { colorLegend, defineChart, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { scaleLinear, scaleOrdinal, scaleUtc } from "d3-scale";
import { useMemo } from "react";

interface WeatherTrendChartProps {
	rows: WeatherChartRow[];
	startDate: string;
	endDate: string;
}

const SERIES_COLORS = [
	"var(--lime)",
	"var(--periwinkle)",
	"var(--tangerine)",
] as const;

const dayFormatter = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	timeZone: "UTC",
});

export function WeatherTrendChart({
	rows,
	startDate,
	endDate,
}: WeatherTrendChartProps) {
	const chartRows = useMemo(
		() =>
			rows.map((row) => ({
				...row,
				date: new Date(`${row.day}T00:00:00.000Z`),
			})),
		[rows],
	);
	const cities = useMemo(
		() => [...new Set(rows.map((row) => row.city))],
		[rows],
	);
	const definition = useMemo(() => {
		const color = scaleOrdinal<string, string>()
			.domain(cities)
			.range(
				cities.map((_, index) => SERIES_COLORS[index] ?? SERIES_COLORS[0]),
			);
		return defineChart({
			marks: [
				lineY(chartRows, {
					id: "daily-temperature",
					x: "date",
					y: "averageTemperatureC",
					z: "city",
					points: true,
					strokeWidth: 2.75,
				}),
			],
			x: {
				scale: scaleUtc,
				nice: true,
				axis: {
					label: "Day",
					ticks: { format: (value) => dayFormatter.format(value) },
				},
			},
			y: {
				scale: scaleLinear,
				nice: true,
				grid: true,
				axis: {
					label: "Average temperature (°C)",
					ticks: { format: (value) => `${value}°` },
				},
			},
			color: {
				scale: color,
				legend: colorLegend({ label: "City" }),
			},
			tooltip,
			animate: true,
		});
	}, [chartRows, cities]);

	return (
		<section className="space-y-4" aria-labelledby="weather-trend-heading">
			<div>
				<p className="font-semibold text-[10px] text-periwinkle uppercase tracking-[0.1em]">
					Measured evidence
				</p>
				<h3 id="weather-trend-heading" className="mt-1 font-bold text-lg">
					Daily average temperature
				</h3>
				<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
					{startDate} through {endDate}. Each point is the average of the
					non-null hourly values for that local calendar day.
				</p>
			</div>

			<div
				className="rounded-2xl border border-border bg-ink p-2"
				data-chart-engine="tanstack-charts"
			>
				<Chart
					definition={definition}
					height={320}
					initialWidth={720}
					ariaLabel="Daily average temperature by city"
					ariaDescription={`Modeled historical weather from ${startDate} through ${endDate}. Exact daily values are listed in the table after the chart.`}
				/>
			</div>

			<div className="max-h-56 overflow-auto rounded-2xl border border-border">
				<table className="w-full border-collapse text-left text-xs">
					<thead className="sticky top-0 bg-ink-soft text-muted-foreground">
						<tr>
							<th className="px-3 py-2 font-semibold">City</th>
							<th className="px-3 py-2 font-semibold">Day</th>
							<th className="px-3 py-2 text-right font-semibold">Avg °C</th>
							<th className="px-3 py-2 text-right font-semibold">Rain mm</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={`${row.city}:${row.day}`}
								className="border-border border-t"
							>
								<td className="px-3 py-2 font-medium">{row.city}</td>
								<td className="px-3 py-2 font-mono text-muted-foreground">
									{row.day}
								</td>
								<td className="px-3 py-2 text-right font-mono tabular-nums">
									{row.averageTemperatureC.toFixed(1)}°C
								</td>
								<td className="px-3 py-2 text-right font-mono tabular-nums">
									{row.precipitationMm.toFixed(1)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<p className="text-[11px] text-muted-foreground leading-relaxed">
				Source:{" "}
				<a
					href="https://open-meteo.com/en/docs/historical-weather-api"
					className="underline decoration-border underline-offset-4 hover:text-foreground"
					target="_blank"
					rel="noreferrer"
				>
					Open-Meteo Historical Weather API
				</a>
				. Modeled historical weather, not station observations.
			</p>
		</section>
	);
}

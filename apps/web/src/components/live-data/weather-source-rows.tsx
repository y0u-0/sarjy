import type { WeatherPreviewRow } from "@sarjy-sql/api/lib/weather-mission";

function previewValue(value: number | null, suffix = ""): string {
	return value === null ? "NULL" : `${value}${suffix}`;
}

const PREVIEW_COLUMNS = [
	"city",
	"observed_at",
	"temperature_c",
	"humidity_pct",
	"precipitation_mm",
	"wind_kmh",
];

export function WeatherSourceRows({ rows }: { rows: WeatherPreviewRow[] }) {
	return (
		<div className="overflow-auto rounded-2xl border border-border">
			<table className="w-full min-w-[720px] border-collapse font-mono text-xs">
				<thead className="bg-ink-soft text-muted-foreground">
					<tr>
						{PREVIEW_COLUMNS.map((column) => (
							<th key={column} className="px-3 py-2 text-left font-semibold">
								{column}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr
							key={`${row.city}:${row.observedAt}`}
							className="border-border border-t"
						>
							<td className="px-3 py-2 font-medium font-sans">{row.city}</td>
							<td className="px-3 py-2 text-muted-foreground">
								{row.observedAt}
							</td>
							<td className="px-3 py-2">
								{previewValue(row.temperatureC, "°C")}
							</td>
							<td className="px-3 py-2">
								{previewValue(row.humidityPct, "%")}
							</td>
							<td className="px-3 py-2">
								{previewValue(row.precipitationMm, "mm")}
							</td>
							<td className="px-3 py-2">{previewValue(row.windKmh, "km/h")}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

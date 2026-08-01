import { ArrowDown } from "lucide-react";

import type { TableInfo } from "@/lib/sql-engine/types";

import { organizeWeatherTables } from "./weather-schema-model";
import { WeatherSchemaTable } from "./weather-schema-table";

function WeatherSchemaLoading() {
	return (
		<aside aria-label="Database schema" className="p-3">
			<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
				Database
			</p>
			<div
				className="mt-3 space-y-3"
				role="status"
				aria-label="Loading database schema"
			>
				<div className="h-20 animate-pulse rounded-xl bg-ink-soft" />
				<div className="h-32 animate-pulse rounded-xl bg-ink-soft" />
				<div className="h-20 animate-pulse rounded-xl bg-ink-soft" />
			</div>
		</aside>
	);
}

function WeatherTableRelationship() {
	return (
		<div
			className="rounded-xl border border-lime/25 bg-lime/8 px-3 py-2.5"
			role="note"
			aria-label="One location has many hourly weather rows"
		>
			<div className="flex items-center gap-2 text-lime">
				<ArrowDown className="size-3.5 shrink-0" />
				<span className="font-semibold text-[10px] uppercase tracking-[0.08em]">
					One city → many hours
				</span>
			</div>
			<code className="mt-1 block break-all font-mono text-[10px] text-foreground">
				locations.id = weather_hourly.location_id
			</code>
		</div>
	);
}

export function WeatherSchemaGuide({ tables }: { tables: TableInfo[] }) {
	if (tables.length === 0) return <WeatherSchemaLoading />;
	const { locations, hourly, snapshot, extras } = organizeWeatherTables(tables);

	return (
		<aside aria-label="Database schema" className="p-3">
			<div className="border-border border-b pb-3">
				<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
					Database
				</p>
				<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
					Three tables. Start with the row meaning, then choose columns.
				</p>
			</div>
			<div className="mt-4 space-y-4">
				{locations && <WeatherSchemaTable table={locations} />}
				{locations && hourly && <WeatherTableRelationship />}
				{hourly && <WeatherSchemaTable table={hourly} />}
				{snapshot && (
					<div className="border-border border-t pt-4">
						<WeatherSchemaTable table={snapshot} />
					</div>
				)}
				{extras.map((table) => (
					<WeatherSchemaTable key={table.name} table={table} />
				))}
			</div>
		</aside>
	);
}

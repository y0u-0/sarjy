import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";
import { Database } from "lucide-react";

import type { TableInfo } from "@/lib/sql-engine/types";

import { WeatherSchemaGuide } from "./weather-schema-guide";

export function MobileWeatherSchemaPanel({ tables }: { tables: TableInfo[] }) {
	return (
		<details className="mt-5 overflow-hidden rounded-2xl border border-border bg-card lg:hidden">
			<summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold text-sm marker:hidden active:bg-ink-soft">
				<Database className="size-4 text-amber" />
				Database · {tables.length > 0 ? tables.length : "loading"} tables
				<span className="ml-auto font-normal text-muted-foreground text-xs">
					View columns
				</span>
			</summary>
			<div className="max-h-[65dvh] overflow-y-auto border-border border-t">
				<WeatherSchemaGuide tables={tables} />
			</div>
		</details>
	);
}

export function DesktopWeatherSchemaPanel({ tables }: { tables: TableInfo[] }) {
	return (
		<div className="hidden min-h-0 overflow-y-auto border-border border-l bg-card/35 lg:block">
			<WeatherSchemaGuide tables={tables} />
		</div>
	);
}

export function WeatherSourceAttribution({
	mission,
}: {
	mission: WeatherMission;
}) {
	return (
		<p className="mt-4 text-center text-[11px] text-muted-foreground">
			Source:{" "}
			<a
				className="underline decoration-border underline-offset-4 hover:text-foreground"
				href={mission.source.url}
				target="_blank"
				rel="noreferrer"
			>
				{mission.source.name}
			</a>
			. {mission.source.dataKind}; frozen for reproducible grading.
		</p>
	);
}

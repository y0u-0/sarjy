import { KeyRound, Link2, Table2 } from "lucide-react";

import type { TableInfo } from "@/lib/sql-engine/types";

import { WEATHER_TABLE_GUIDES } from "./weather-schema-model";

export function WeatherSchemaTable({ table }: { table: TableInfo }) {
	const guide = WEATHER_TABLE_GUIDES[table.name];
	return (
		<section
			aria-labelledby={`schema-${table.name}`}
			data-schema-table={table.name}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<h3
						id={`schema-${table.name}`}
						className="flex items-center gap-1.5 font-mono font-semibold text-foreground text-xs"
					>
						<Table2 className="size-3.5 shrink-0 text-amber" />
						<span className="truncate">{table.name}</span>
					</h3>
					{guide && (
						<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
							{guide.purpose}
						</p>
					)}
				</div>
				<span className="shrink-0 rounded-full bg-ink-soft px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
					{table.rowCount.toLocaleString()}{" "}
					{table.rowCount === 1 ? "row" : "rows"}
				</span>
			</div>

			{guide && (
				<p className="mt-2 border-border border-l-2 pl-2 font-medium text-[11px] text-foreground">
					{guide.rowMeaning}
				</p>
			)}

			<ul className="mt-3 divide-y divide-border/70 border-border border-y">
				{table.columns.map((column) => {
					const columnGuide = guide?.columns[column.name];
					return (
						<li key={column.name} className="py-2 first:pt-2">
							<div className="flex items-center justify-between gap-2">
								<code className="min-w-0 truncate font-mono text-[11px] text-foreground">
									{column.name}
								</code>
								<span className="shrink-0 font-mono text-[9px] text-muted-foreground uppercase">
									{column.type.toLowerCase()}
								</span>
							</div>
							{columnGuide && (
								<div className="mt-0.5 flex items-center justify-between gap-2">
									<span className="text-[10px] text-muted-foreground leading-snug">
										{columnGuide.description}
									</span>
									{columnGuide.key && (
										<span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[9px] text-lime uppercase tracking-[0.06em]">
											{columnGuide.key === "Primary key" ? (
												<KeyRound className="size-2.5" />
											) : (
												<Link2 className="size-2.5" />
											)}
											{columnGuide.key}
										</span>
									)}
								</div>
							)}
						</li>
					);
				})}
			</ul>
		</section>
	);
}

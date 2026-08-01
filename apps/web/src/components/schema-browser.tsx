import { Table2 } from "lucide-react";

import type { TableInfo } from "@/lib/sql-engine/types";

export function SchemaBrowser({ tables }: { tables: TableInfo[] }) {
	if (tables.length === 0) {
		return (
			<p className="p-2 font-mono text-muted-foreground text-xs">
				Loading schema…
			</p>
		);
	}

	return (
		<div className="space-y-3 font-mono">
			{tables.map((table) => (
				<div key={table.name}>
					<p className="flex items-center gap-1.5 text-xs">
						<Table2 className="size-3.5 text-amber" />
						<span className="font-semibold text-foreground">{table.name}</span>
						<span className="text-muted-foreground">({table.rowCount})</span>
					</p>
					<ul className="mt-1 ml-5 space-y-0.5">
						{table.columns.map((column) => (
							<li key={column.name} className="text-muted-foreground text-xs">
								{column.name}{" "}
								<span className="opacity-60">{column.type.toLowerCase()}</span>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}

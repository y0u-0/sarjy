import { cn } from "@sarjy-sql/ui/lib/utils";
import { ArrowUpDown, Check, Minus, Plus } from "lucide-react";
import { useMemo } from "react";

import { useProgressiveReveal } from "@/hooks/use-progressive-reveal";
import {
	buildResultDiff,
	countDiffRows,
	type RowStatus,
} from "@/lib/sql-engine/result-diff";
import type { CellValue, QueryResult } from "@/lib/sql-engine/types";

const STATUS_META: Record<
	RowStatus,
	{ icon: typeof Check; chip: string; label: string }
> = {
	match: {
		icon: Check,
		chip: "border-lime/60 bg-lime/12 text-lime",
		label: "correct",
	},
	missing: {
		icon: Minus,
		chip: "border-amber/60 bg-amber/12 text-amber",
		label: "missing",
	},
	extra: {
		icon: Plus,
		chip: "border-tangerine/60 bg-tangerine/12 text-tangerine",
		label: "extra",
	},
	misordered: {
		icon: ArrowUpDown,
		chip: "border-periwinkle/60 bg-periwinkle/12 text-periwinkle",
		label: "out of order",
	},
};

interface ResultDiffProps {
	actual: QueryResult;
	expected: QueryResult;
	ordered: boolean;
	replayKey: number;
	className?: string;
}

export function ResultDiff({
	actual,
	expected,
	ordered,
	replayKey,
	className,
}: ResultDiffProps) {
	const rows = useMemo(
		() => buildResultDiff(actual, expected, ordered),
		[actual, expected, ordered],
	);
	const counts = useMemo(() => countDiffRows(rows), [rows]);
	const revealed = useProgressiveReveal(rows.length, replayKey);
	const columns =
		expected.columns.length > 0 ? expected.columns : actual.columns;

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<DiffLegend counts={counts} />
			<div className="flex flex-col gap-1">
				{rows.map((row, index) => {
					const meta = STATUS_META[row.status];
					const Icon = meta.icon;
					return (
						<div
							key={row.key}
							className={cn(
								"flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-300",
								meta.chip,
								index < revealed
									? "translate-x-0 opacity-100"
									: "-translate-x-2 opacity-0",
								row.status === "missing" && "border-dashed",
							)}
						>
							<Icon className="size-3 shrink-0" />
							<span className="w-10 shrink-0 font-mono text-[10px] opacity-70">
								#{row.status === "missing" ? row.expectedAt : row.actualAt}
							</span>
							<DiffCells columns={columns} values={row.values} />
							{row.status === "misordered" && (
								<span className="shrink-0 font-mono text-[10px] opacity-80">
									wanted #{row.expectedAt}
								</span>
							)}
						</div>
					);
				})}
			</div>
			<DiffConclusion counts={counts} />
		</div>
	);
}

function DiffLegend({ counts }: { counts: Record<RowStatus, number> }) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
				Row by row
			</p>
			{(["match", "misordered", "missing", "extra"] as RowStatus[])
				.filter((status) => counts[status] > 0)
				.map((status) => (
					<span
						key={status}
						className={cn(
							"rounded-full border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-[0.08em]",
							STATUS_META[status].chip,
						)}
					>
						{counts[status]} {STATUS_META[status].label}
					</span>
				))}
		</div>
	);
}

function DiffCells({
	columns,
	values,
}: {
	columns: string[];
	values: Record<string, CellValue>;
}) {
	return (
		<div className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-0.5">
			{columns.map((column) => (
				<span key={column} className="font-mono text-[11px] text-foreground">
					<span className="text-muted-foreground">{column}=</span>
					{values[column] === null ? "NULL" : String(values[column] ?? "NULL")}
				</span>
			))}
		</div>
	);
}

function DiffConclusion({ counts }: { counts: Record<RowStatus, number> }) {
	if (counts.missing === 0 && counts.extra === 0 && counts.misordered === 0) {
		return (
			<p className="text-lime text-xs">
				Every row matches, and in the right order.
			</p>
		);
	}
	if (counts.misordered > 0 && counts.missing === 0 && counts.extra === 0) {
		return (
			<p className="text-muted-foreground text-xs">
				You found exactly the right rows — they are just in the wrong order.
				That is an ORDER BY problem, not a WHERE problem.
			</p>
		);
	}
	return null;
}

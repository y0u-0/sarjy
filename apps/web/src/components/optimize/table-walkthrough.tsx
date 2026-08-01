import { cn } from "@sarjy-sql/ui/lib/utils";

import type { WalkController } from "@/lib/optimize/walk-controller";
import type { WalkResponse } from "@/lib/sql-engine/types";

import { TableWalkthroughControls } from "./table-walkthrough-controls";
import { TableWalkthroughRows } from "./table-walkthrough-rows";
import { useTableWalkthrough } from "./use-table-walkthrough";

interface TableWalkthroughProps {
	walk: WalkResponse;
	replayKey: number;
	onRegister?: (controller: WalkController | null) => void;
	className?: string;
}

export function TableWalkthrough({
	walk,
	replayKey,
	onRegister,
	className,
}: TableWalkthroughProps) {
	const model = useTableWalkthrough(walk, replayKey, onRegister);
	if (!walk.supported)
		return <UnsupportedWalkthrough walk={walk} className={className} />;
	return (
		<div
			className={cn(
				"flex flex-col gap-2 rounded-2xl border border-border bg-ink-soft p-3",
				className,
			)}
		>
			<TableWalkthroughControls walk={walk} model={model} />
			{walk.where && (
				<p className="font-mono text-[11px] text-muted-foreground">
					testing each row against{" "}
					<span className="rounded bg-foreground/10 px-1 text-foreground">
						WHERE {walk.where}
					</span>
				</p>
			)}
			<TableWalkthroughRows walk={walk} model={model} />
			<p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
				Which rows survive is measured — the engine ran your WHERE clause to
				find them. The order they are visited in is illustrative; SQLite does
				not report the sequence it used.
				{walk.truncated && ` Showing the first ${model.total} rows only.`}
			</p>
		</div>
	);
}

function UnsupportedWalkthrough({
	walk,
	className,
}: {
	walk: WalkResponse;
	className?: string;
}) {
	const message = walk.blockers.includes("too-many-tables")
		? "This query joins three or more tables. The walkthrough covers one table or a two-table join; beyond that the picture stops being readable."
		: walk.blockers.includes("join-not-walkable")
			? "This join cannot be traced row by row — one side is a subquery or view rather than a plain table."
			: "This query shape cannot be walked row by row.";
	return (
		<div
			className={cn(
				"rounded-2xl border border-border border-dashed p-3",
				className,
			)}
		>
			<p className="text-[11px] text-muted-foreground leading-relaxed">
				{message}
			</p>
		</div>
	);
}

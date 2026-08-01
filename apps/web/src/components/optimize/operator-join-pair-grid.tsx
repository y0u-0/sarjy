import type { WalkResponse } from "@/lib/sql-engine/types";

export function JoinPairGrid({
	pairs,
}: {
	pairs: NonNullable<WalkResponse["join"]>["pairs"];
}) {
	return (
		<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
			{pairs.map((pair, index) => (
				<div
					key={`${pair.left}-${pair.right}-${index}`}
					className="rounded-xl border border-border bg-ink px-2.5 py-2 font-mono text-[10px]"
				>
					<span className="text-muted-foreground">left </span>
					{pair.left}
					<span className="text-periwinkle"> → </span>
					<span className="text-muted-foreground">right </span>
					{pair.right ?? "NULL"}
				</div>
			))}
		</div>
	);
}

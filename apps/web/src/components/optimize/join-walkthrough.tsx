import { cn } from "@sarjy-sql/ui/lib/utils";

import type { WalkController } from "@/lib/optimize/walk-controller";
import type { JoinWalk } from "@/lib/sql-engine/types";

import { JoinWalkthroughControls } from "./join-walkthrough-controls";
import { JoinWalkthroughPanels } from "./join-walkthrough-panels";
import { useJoinWalkthrough } from "./use-join-walkthrough";

interface JoinWalkthroughProps {
	join: JoinWalk;
	replayKey: number;
	onRegister?: (controller: WalkController | null) => void;
	className?: string;
}

export function JoinWalkthrough({
	join,
	replayKey,
	onRegister,
	className,
}: JoinWalkthroughProps) {
	const walk = useJoinWalkthrough(join, replayKey, onRegister);
	return (
		<div
			className={cn(
				"flex flex-col gap-2 rounded-2xl border border-border bg-ink-soft p-3",
				className,
			)}
		>
			<JoinWalkthroughControls join={join} walk={walk} />
			{join.on && (
				<p className="font-mono text-[11px] text-muted-foreground">
					matching on{" "}
					<span className="rounded bg-foreground/10 px-1 text-foreground">
						{join.on}
					</span>
				</p>
			)}
			<JoinWalkthroughPanels join={join} walk={walk} />
			<p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
				Every pairing is measured: the engine ran this join and reported both
				sides' rows.
				{walk.unmatchedCount > 0
					? ` ${walk.unmatchedCount} ${join.leftTable} row(s) matched nothing — a plain JOIN would drop them, this ${join.kind === "left" ? "LEFT JOIN keeps them with NULLs" : "join drops them"}.`
					: ""}{" "}
				The order pairs are visited in is illustrative.
			</p>
		</div>
	);
}

import { Button } from "@sarjy-sql/ui/components/button";
import { cn } from "@sarjy-sql/ui/lib/utils";
import {
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	RotateCcw,
} from "lucide-react";

import type { JoinWalk } from "@/lib/sql-engine/types";

import { JOIN_SPEEDS } from "./join-walkthrough-model";
import type { JoinWalkthroughModel } from "./use-join-walkthrough";

export function JoinWalkthroughControls({
	join,
	walk,
}: {
	join: JoinWalk;
	walk: JoinWalkthroughModel;
}) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
				{join.leftTable} {join.kind === "left" ? "left join" : "join"}{" "}
				{join.rightTable}
			</p>
			<span
				className={cn(
					"rounded-full border px-2 py-0.5 font-mono text-[10px]",
					walk.done
						? "border-lime/60 bg-lime/15 text-lime"
						: "border-amber/60 bg-amber/15 text-amber",
				)}
			>
				{walk.done
					? `${walk.total} output rows`
					: `pair ${Math.min(walk.cursor + 1, walk.total)} of ${walk.total}`}
			</span>
			{walk.matchIndex > 0 && (
				<span className="animate-stamp rounded-full border border-amber bg-amber px-2 py-0.5 font-semibold text-[10px] text-ink uppercase tracking-[0.08em]">
					same left row, match {walk.matchIndex + 1}
				</span>
			)}
			<div className="ml-auto flex flex-wrap items-center justify-end gap-1">
				{JOIN_SPEEDS.map((speed, index) => (
					<button
						key={speed.label}
						type="button"
						onClick={() => walk.setSpeedIndex(index)}
						disabled={walk.reducedMotion}
						className={cn(
							"rounded-full border px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-300 disabled:opacity-45",
							index === walk.speedIndex
								? "border-cream bg-cream text-ink"
								: "border-border text-muted-foreground hover:bg-foreground/10",
						)}
					>
						{speed.label}
					</button>
				))}
				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => {
						walk.setPlaying(false);
						walk.setCursor((value) => Math.max(0, value - 1));
					}}
					disabled={walk.cursor === 0}
					aria-label="Previous join pair"
				>
					<ChevronLeft />
				</Button>
				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => {
						if (walk.done) {
							walk.setCursor(0);
							walk.setPlaying(!walk.reducedMotion);
						} else walk.setPlaying((value) => !value);
					}}
					disabled={walk.reducedMotion && !walk.done}
					aria-label={
						walk.done
							? "Restart at the first join pair"
							: walk.playing
								? "Pause"
								: "Play"
					}
				>
					{walk.done ? <RotateCcw /> : walk.playing ? <Pause /> : <Play />}
				</Button>
				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => {
						walk.setPlaying(false);
						walk.setCursor((value) => Math.min(walk.total, value + 1));
					}}
					disabled={walk.done}
					aria-label="Next join pair"
				>
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}

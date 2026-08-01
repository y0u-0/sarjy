import { Button } from "@sarjy-sql/ui/components/button";
import { cn } from "@sarjy-sql/ui/lib/utils";
import {
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	RotateCcw,
} from "lucide-react";

import type { WalkResponse } from "@/lib/sql-engine/types";

import { TABLE_WALK_SPEEDS } from "./table-walkthrough-model";
import type { TableWalkthroughModel } from "./use-table-walkthrough";

export function TableWalkthroughControls({
	walk,
	model,
}: {
	walk: WalkResponse;
	model: TableWalkthroughModel;
}) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
				Walking {walk.table}
			</p>
			<span
				className={cn(
					"rounded-full border px-2 py-0.5 font-mono text-[10px]",
					model.done
						? "border-lime/60 bg-lime/15 text-lime"
						: "border-amber/60 bg-amber/15 text-amber",
				)}
			>
				{model.done
					? `${model.keptSoFar.length} of ${model.total} kept`
					: `row ${Math.min(model.cursor + 1, model.total)} of ${model.total}`}
			</span>
			<div className="ml-auto flex flex-wrap items-center justify-end gap-1">
				{TABLE_WALK_SPEEDS.map((speed, index) => (
					<button
						key={speed.label}
						type="button"
						onClick={() => model.setSpeedIndex(index)}
						disabled={model.reducedMotion}
						className={cn(
							"rounded-full border px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-300 disabled:opacity-45",
							index === model.speedIndex
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
						model.setPlaying(false);
						model.setCursor((value) => Math.max(0, value - 1));
					}}
					disabled={model.cursor === 0}
					aria-label="Previous row"
				>
					<ChevronLeft />
				</Button>
				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => {
						if (model.done) {
							model.setCursor(0);
							model.setPlaying(!model.reducedMotion);
						} else model.setPlaying((value) => !value);
					}}
					disabled={model.reducedMotion && !model.done}
					aria-label={
						model.done
							? "Restart at the first row"
							: model.playing
								? "Pause"
								: "Play"
					}
				>
					{model.done ? <RotateCcw /> : model.playing ? <Pause /> : <Play />}
				</Button>
				<Button
					size="icon-xs"
					variant="ghost"
					onClick={() => {
						model.setPlaying(false);
						model.setCursor((value) => Math.min(model.total, value + 1));
					}}
					disabled={model.done}
					aria-label="Next row"
				>
					<ChevronRight />
				</Button>
			</div>
		</div>
	);
}

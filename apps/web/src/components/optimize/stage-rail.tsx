import { cn } from "@sarjy-sql/ui/lib/utils";

/**
 * Shows where the student is in a walkthrough. Sarjy sets the stage as she goes,
 * which is what turns a pile of buttons into a guided lesson: the student can
 * always see what they are doing now and what is coming.
 */

export const LAB_STAGES = [
	{
		id: "interpret",
		label: "Interpret",
		blurb: "Explain what the SQL returns",
	},
	{ id: "observe", label: "Observe", blurb: "See how slow it is and why" },
	{ id: "predict", label: "Predict", blurb: "Commit to a guess" },
	{ id: "fix", label: "Change", blurb: "Change the query or schema" },
	{ id: "compare", label: "Compare", blurb: "What actually changed" },
] as const;

export type LabStage = (typeof LAB_STAGES)[number]["id"];

interface StageRailProps {
	stage: LabStage | null;
	note: string | null;
	className?: string;
}

export function StageRail({ stage, note, className }: StageRailProps) {
	const activeIndex = LAB_STAGES.findIndex((entry) => entry.id === stage);

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex items-stretch gap-1.5">
				{LAB_STAGES.map((entry, index) => {
					const isActive = index === activeIndex;
					const isDone = activeIndex > index;
					return (
						<div
							key={entry.id}
							className={cn(
								"flex flex-1 flex-col gap-0.5 rounded-2xl border px-3 py-2 transition-colors duration-300",
								isActive && "border-periwinkle bg-periwinkle/15",
								isDone && "border-lime/50 bg-lime/10",
								!isActive && !isDone && "border-border",
							)}
						>
							<span
								className={cn(
									"font-semibold text-[10px] uppercase tracking-[0.08em]",
									isActive
										? "text-periwinkle"
										: isDone
											? "text-lime"
											: "text-muted-foreground",
								)}
							>
								{index + 1}. {entry.label}
							</span>
							<span className="text-[11px] text-muted-foreground leading-tight">
								{entry.blurb}
							</span>
						</div>
					);
				})}
			</div>
			{note && (
				<p className="animate-stamp rounded-xl border border-periwinkle/50 bg-periwinkle/10 px-3 py-1.5 text-foreground text-xs">
					{note}
				</p>
			)}
		</div>
	);
}

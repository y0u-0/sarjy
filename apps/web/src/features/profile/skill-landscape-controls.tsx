import { cn } from "@sarjy-sql/ui/lib/utils";

import type {
	SkillHistorySnapshotView,
	SkillLandscapeView,
} from "./skill-landscape-model";

function snapshotLabel(snapshot: SkillHistorySnapshotView): string {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(snapshot.endedAt));
}

export function SkillLandscapeHeader({
	totalAttempts,
}: {
	totalAttempts: number;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 className="font-bold text-sm">Your SQL shape</h2>
				<p className="mt-1 max-w-lg text-muted-foreground text-xs">
					Now compared with an earlier completed session. Farther out means
					stronger submission evidence.
				</p>
			</div>
			<div className="text-right">
				<p className="font-mono font-semibold text-lg tabular-nums leading-none">
					{totalAttempts}
				</p>
				<p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
					exercise episodes
				</p>
			</div>
		</div>
	);
}

export function SkillLandscapeControls({
	view,
	onViewChange,
	history,
	comparisonId,
	onComparisonChange,
}: {
	view: SkillLandscapeView;
	onViewChange: (view: SkillLandscapeView) => void;
	history: SkillHistorySnapshotView[];
	comparisonId: string | null;
	onComparisonChange: (id: string | null) => void;
}) {
	return (
		<div className="mt-4 flex flex-wrap items-end justify-between gap-3">
			<div
				className="inline-flex rounded-full border border-border p-1"
				role="tablist"
				aria-label="Skill shape topics"
			>
				{(["learn", "optimization"] as const).map((option) => (
					<button
						key={option}
						type="button"
						role="tab"
						aria-selected={view === option}
						onClick={() => onViewChange(option)}
						className={cn(
							"rounded-full px-3 py-1 font-semibold text-xs transition-colors duration-150 motion-reduce:transition-none",
							view === option
								? "bg-foreground text-background"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{option === "learn" ? "Learn topics" : "Optimization"}
					</button>
				))}
			</div>

			{history.length > 0 && (
				<label className="grid gap-1 text-[10px] text-muted-foreground uppercase tracking-[0.08em]">
					Compare now with
					<select
						value={comparisonId ?? "current"}
						onChange={(event) =>
							onComparisonChange(
								event.target.value === "current" ? null : event.target.value,
							)
						}
						className="min-h-9 rounded-lg border border-border bg-background px-2.5 font-semibold text-foreground text-xs normal-case tracking-normal outline-none focus-visible:ring-2 focus-visible:ring-periwinkle"
					>
						<option value="current">No comparison</option>
						{[...history].reverse().map((snapshot) => (
							<option key={snapshot.id} value={snapshot.id}>
								Session {snapshot.sessionNumber} · {snapshotLabel(snapshot)}
							</option>
						))}
					</select>
				</label>
			)}
		</div>
	);
}

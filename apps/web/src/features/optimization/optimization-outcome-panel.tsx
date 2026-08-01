import { cn } from "@sarjy-sql/ui/lib/utils";
import { BookOpenCheck } from "lucide-react";

import type { OptimizationLabProblem } from "@/lib/curriculum/optimization-bank";
import type { OptimizationOutcome } from "@/lib/optimize/success";

export function OptimizationOutcomePanel({
	problem,
	outcome,
}: {
	problem: OptimizationLabProblem;
	outcome: OptimizationOutcome | null;
}) {
	if (!outcome) return null;

	return (
		<div
			className={cn(
				"motion-safe:fade-in border p-4 motion-safe:animate-in motion-safe:duration-200",
				outcome.passed
					? "border-lime/45 bg-lime/8"
					: "border-tangerine/45 bg-tangerine/8",
			)}
		>
			<p className="flex items-center gap-2 font-semibold text-sm">
				<BookOpenCheck className="size-4" />
				{outcome.passed ? "Measured goal reached" : "Keep investigating"}
			</p>
			<p className="mt-1 text-sm leading-relaxed">{outcome.reason}</p>
			{problem.mode === "rewrite" && outcome.passed && (
				<div className="mt-3 space-y-2 border-current/20 border-t pt-3 text-xs leading-relaxed">
					<p>{problem.explanation}</p>
					{problem.caveat && (
						<p className="text-muted-foreground">Trade-off: {problem.caveat}</p>
					)}
				</div>
			)}
			{outcome.passed && (
				<p className="mt-2 border-current/20 border-t pt-2 text-xs leading-relaxed">
					You verified the answer, compared measured work, considered an
					alternative, and explained the plan evidence.
				</p>
			)}
		</div>
	);
}

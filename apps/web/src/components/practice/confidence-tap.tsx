import type { ConfidenceLevel } from "@sarjy-sql/api/lib/practice-policy";
import { cn } from "@sarjy-sql/ui/lib/utils";

/**
 * One tap, before the result is revealed: does the student think this will work?
 *
 * This is the only thing in the app that reads a student's own sense of how they
 * are doing, and it is here because the alignment between predicted and actual
 * outcome is the single dialogue-derived signal with real predictive power —
 * r = .42, entering a regression alongside correctness for R² = .71, in a study
 * where how *uncertain* a student sounded predicted nothing at all.
 *
 * Three details are load-bearing:
 *   - Binary, not a scale. The 2x2 is all the policy consumes, and binary
 *     judgements are more reliable than graded ones.
 *   - Asked before the reveal. A prediction made after seeing the answer measures
 *     nothing.
 *   - Declinable. Nothing is gated on answering, because a forced prediction is a
 *     guess and a guess is noise.
 */
export function ConfidenceTap({
	value,
	onChange,
	disabled,
}: {
	value: ConfidenceLevel | null;
	onChange: (level: ConfidenceLevel | null) => void;
	disabled?: boolean;
}) {
	const options: { level: ConfidenceLevel; label: string }[] = [
		{ level: "sure", label: "I've got this" },
		{ level: "unsure", label: "Not sure" },
	];

	return (
		<div className="flex items-center gap-2 text-xs">
			<span className="text-muted-foreground">Call it before you run:</span>
			{options.map(({ level, label }) => (
				<button
					key={level}
					type="button"
					disabled={disabled}
					aria-pressed={value === level}
					onClick={() => onChange(value === level ? null : level)}
					className={cn(
						"rounded-full border px-2.5 py-1 font-medium transition-colors",
						"disabled:cursor-not-allowed disabled:opacity-40",
						value === level
							? "border-lime bg-lime/15 text-lime"
							: "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground",
					)}
				>
					{label}
				</button>
			))}
		</div>
	);
}

import type { PracticeAction } from "@sarjy-sql/api/lib/practice-policy";
import { cn } from "@sarjy-sql/ui/lib/utils";
import { useState } from "react";

export interface PracticeSignals {
	mastery: number;
	opportunities: number;
	consecutiveFailures: number;
	calibration: {
		alignedConfident: number;
		overconfident: number;
		underconfident: number;
		alignedUnsure: number;
	};
}

/**
 * The moment the app offers more work — or declines to.
 *
 * Framing here is the whole design. Across every adaptive platform surveyed, none
 * used deficit language in learner-facing copy; the one that best solved this
 * problem writes "80 could be the perfect stopping point", which makes extra
 * practice a genuine choice rather than a sentence. The nearest thing to a
 * controlled study of automatic supplementary work found it helped — and found
 * that the same system's *scolding* channel did nothing at all.
 *
 * Two things are deliberately absent: any count of how many exercises exist, and
 * any explanation of what the student did wrong to trigger this. Showing a
 * denominator makes remaining work feel owed, and the reasoning belongs to Sarjy in
 * conversation, not to a banner.
 */
export function PracticeOffer({
	action,
	reason,
	signals,
}: {
	action: PracticeAction;
	reason: string;
	signals: PracticeSignals;
}) {
	const [showModel, setShowModel] = useState(false);

	if (action === "hold") return null;

	const tone =
		action === "consolidate"
			? "border-amber-500/40 bg-amber-500/5"
			: action === "advance"
				? "border-lime/40 bg-lime/5"
				: "border-border bg-card";

	return (
		<section className={cn("shrink-0 rounded-2xl border p-4", tone)}>
			<div className="flex items-start justify-between gap-3">
				<p className="text-sm leading-relaxed">{reason}</p>
				<button
					type="button"
					onClick={() => setShowModel((open) => !open)}
					className="shrink-0 text-muted-foreground text-xs underline decoration-dotted hover:text-foreground"
				>
					{showModel ? "hide" : "why?"}
				</button>
			</div>

			{action === "consolidate" && (
				<p className="mt-3 text-muted-foreground text-xs">
					Ask Sarjy to walk this one through with you — that lands better than
					another attempt right now.
				</p>
			)}

			{showModel && <LearnerModel signals={signals} />}
		</section>
	);
}

/**
 * The model, shown to the student so a wrong inference is arguable rather than
 * silent. Worth being honest that this is here for transparency, not on evidence
 * that it raises scores: learner control across 18 studies comes out at g = 0.05,
 * and the one controlled trial of an open learner model in SQL specifically found
 * no significant difference between groups.
 */
function LearnerModel({ signals }: { signals: PracticeSignals }) {
	const { calibration } = signals;
	const predictions =
		calibration.alignedConfident +
		calibration.overconfident +
		calibration.underconfident +
		calibration.alignedUnsure;

	return (
		<dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-border border-t pt-3 text-xs">
			<Row
				label="Confidence here"
				value={`${Math.round(signals.mastery * 100)}%`}
			/>
			<Row label="Attempts logged" value={String(signals.opportunities)} />
			{signals.consecutiveFailures > 0 && (
				<Row
					label="Missed in a row"
					value={String(signals.consecutiveFailures)}
				/>
			)}
			{predictions > 0 && (
				<Row
					label="Calls you got right"
					value={`${calibration.alignedConfident + calibration.alignedUnsure} of ${predictions}`}
				/>
			)}
			<p className="col-span-2 mt-1 text-muted-foreground">
				Wrong about you? Tell Sarjy and she'll adjust it.
			</p>
		</dl>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<>
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="font-mono tabular-nums">{value}</dd>
		</>
	);
}

import type { ProfileEvidenceModel } from "./profile-model";

function ProfileStat({
	label,
	value,
	of,
}: {
	label: string;
	value: string;
	of: string;
}) {
	return (
		<div className="rounded-2xl border border-border bg-card px-4 py-3">
			<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
				{label}
			</p>
			<p className="mt-1 font-extrabold text-2xl tabular-nums leading-none">
				{value}
			</p>
			<p className="mt-1 text-muted-foreground text-xs">{of}</p>
		</div>
	);
}

function CalibrationSummary({
	right,
	total,
	over,
	under,
}: {
	right: number;
	total: number;
	over: number;
	under: number;
}) {
	const verdict =
		over > under * 2
			? "You tend to back yourself a bit early. Worth checking the row count before you submit."
			: under > over * 2
				? "You're harder on yourself than the results are. When you think you're unsure, you're usually right anyway."
				: "You read yourself well. That's genuinely useful — it means you know when to slow down.";
	return (
		<section className="mt-3 rounded-2xl border border-periwinkle/40 bg-periwinkle/5 p-4">
			<p className="font-semibold text-xs uppercase tracking-[0.08em]">
				Knowing when you know
			</p>
			<p className="mt-1.5 text-sm leading-relaxed">
				You called it right{" "}
				<span className="font-mono font-semibold tabular-nums">
					{right} of {total}
				</span>{" "}
				times. {verdict}
			</p>
		</section>
	);
}

export function ProfileStats({ evidence }: { evidence: ProfileEvidenceModel }) {
	const { totals } = evidence;
	return (
		<>
			<section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<ProfileStat
					label="Solid"
					value={`${evidence.solidCount}`}
					of={`of ${evidence.started.length}`}
				/>
				<ProfileStat
					label="Exercises evaluated"
					value={`${totals.attempts}`}
					of={`${totals.passes} right`}
				/>
				<ProfileStat
					label="Understood aloud"
					value={`${evidence.explainedCount}`}
					of={`of ${evidence.started.length} checked`}
				/>
				<ProfileStat
					label="Self-reads"
					value={
						totals.calls > 0
							? `${Math.round((totals.rightCalls / totals.calls) * 100)}%`
							: "—"
					}
					of={
						totals.calls > 0
							? `${totals.rightCalls} of ${totals.calls} calls`
							: "no calls yet"
					}
				/>
			</section>
			{totals.calls >= 4 && (
				<CalibrationSummary
					right={totals.rightCalls}
					total={totals.calls}
					over={evidence.started.reduce(
						(sum, row) => sum + row.calibration.overconfident,
						0,
					)}
					under={evidence.started.reduce(
						(sum, row) => sum + row.calibration.underconfident,
						0,
					)}
				/>
			)}
		</>
	);
}

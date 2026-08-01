import type { BenchmarkResult } from "@/lib/sql-engine/types";

import { formatCount } from "./benchmark-format";

export function describeBenchmarkChange(
	baseline: BenchmarkResult,
	current: BenchmarkResult,
): { label: string; good: boolean; note?: string } | null {
	const before = baseline.work;
	const after = current.work;

	if (before && after) {
		if (before.fullScanSteps > 0 && after.fullScanSteps === 0) {
			return {
				label: "stopped scanning",
				good: true,
				note: `SQLite's full-scan counter went from ${formatCount(before.fullScanSteps)} forward steps to zero. That proves the full scan disappeared; it does not claim the indexed lookup did zero work.`,
			};
		}
		if (before.sorts > 0 && after.sorts === 0) {
			return {
				label: "sort gone",
				good: true,
				note: "The rows already arrive in the right order, so there is nothing left to sort.",
			};
		}
		if (after.fullScanSteps < before.fullScanSteps * 0.9) {
			const ratio = before.fullScanSteps / Math.max(after.fullScanSteps, 1);
			return {
				label: `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}x fewer full-scan steps`,
				good: true,
			};
		}
		if (after.fullScanSteps > before.fullScanSteps * 1.1) {
			return { label: "more full-scan work", good: false };
		}
		if (after.autoIndexRows < before.autoIndexRows) {
			return {
				label: "less automatic-index work",
				good: true,
				note: `SQLite inserted ${formatCount(before.autoIndexRows)} rows into transient indexes before and ${formatCount(after.autoIndexRows)} after.`,
			};
		}
		if (
			!before.vmStepsOverflowed &&
			!after.vmStepsOverflowed &&
			after.vmSteps < before.vmSteps * 0.85
		) {
			const ratio = before.vmSteps / Math.max(after.vmSteps, 1);
			return {
				label: `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}x fewer VM operations`,
				good: true,
				note: "This is SQLite's deterministic virtual-machine operation count, not a promise of the same wall-clock speedup.",
			};
		}
	}

	const timeRatio =
		current.medianMs > 0 ? baseline.medianMs / current.medianMs : null;
	if (timeRatio === null) return null;

	const stepsRose =
		before && after
			? !before.vmStepsOverflowed &&
				!after.vmStepsOverflowed &&
				after.vmSteps > before.vmSteps
			: false;

	if (timeRatio >= 1.15) {
		return {
			label: `${timeRatio >= 10 ? Math.round(timeRatio) : timeRatio.toFixed(1)}x quicker`,
			good: true,
			note: stepsRose
				? "Quicker on the clock even though it runs more instructions — not every instruction costs the same, so step count and speed can disagree. Both numbers are real."
				: "Same full-scan count, but quicker. The saving is elsewhere in the execution, so the clock remains supporting evidence rather than proof by itself.",
		};
	}
	if (timeRatio < 0.85) {
		return { label: `${(1 / timeRatio).toFixed(1)}x slower`, good: false };
	}
	return { label: "no real change", good: false };
}

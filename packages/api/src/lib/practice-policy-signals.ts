import type {
	CalibrationTally,
	ConfidenceLevel,
	MisconceptionKind,
	Trajectory,
} from "./practice-policy-types";

const STUCK_REPEAT_THRESHOLD = 3;

export function classifyTrajectory(
	recentKinds: MisconceptionKind[],
): Trajectory {
	if (recentKinds.length < 2) return "unknown";
	const run = recentKinds.slice(0, STUCK_REPEAT_THRESHOLD);
	if (
		run.length >= STUCK_REPEAT_THRESHOLD &&
		run.every((kind) => kind === run[0])
	) {
		return "stuck";
	}
	return new Set(recentKinds.slice(0, 3)).size >= 2 ? "converging" : "mixed";
}

export function tallyCalibration(
	attempts: { predicted: ConfidenceLevel | null; passed: boolean }[],
): CalibrationTally {
	const tally: CalibrationTally = {
		alignedConfident: 0,
		overconfident: 0,
		underconfident: 0,
		alignedUnsure: 0,
	};
	for (const { predicted, passed } of attempts) {
		if (predicted === "sure") {
			if (passed) tally.alignedConfident += 1;
			else tally.overconfident += 1;
		} else if (predicted === "unsure") {
			if (passed) tally.underconfident += 1;
			else tally.alignedUnsure += 1;
		}
	}
	return tally;
}

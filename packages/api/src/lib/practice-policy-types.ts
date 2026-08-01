import type { MisconceptionKind } from "@sarjy-sql/db/schema/memory";
import type {
	ConfidenceLevel,
	SessionInsightKind,
} from "@sarjy-sql/db/schema/practice";

export type { ConfidenceLevel, MisconceptionKind, SessionInsightKind };

export type PracticeAction =
	| "advance"
	| "review"
	| "consolidate"
	| "practise"
	| "rest"
	| "hold";

export interface CalibrationTally {
	alignedConfident: number;
	overconfident: number;
	underconfident: number;
	alignedUnsure: number;
}

export interface ConceptSignals {
	concept: string;
	mastery: number;
	opportunities: number;
	opportunitiesThisSession: number;
	consecutiveFailures: number;
	recentKinds: MisconceptionKind[];
	calibration: CalibrationTally;
	spokenSignals: SessionInsightKind[];
	explanation: "correct" | "incorrect" | null;
	distinctPassedExercises: number;
	unassistedPasses: number;
	everMastered: boolean;
}

export interface Recommendation {
	action: PracticeAction;
	concept: string;
	reason: string;
	unlockCount: number;
}

export type Trajectory = "stuck" | "converging" | "mixed" | "unknown";

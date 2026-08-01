import type {
	ConfidenceLevel,
	PracticeAction,
} from "@sarjy-sql/api/lib/practice-policy";
import type { RefObject } from "react";

import type { PracticeSignals } from "@/components/practice/practice-offer";
import type { ExerciseWithLesson } from "@/lib/curriculum/types";
import type { WalkController } from "@/lib/optimize/walk-controller";
import type {
	GradeReport,
	QueryResult,
	TableInfo,
	WalkResponse,
} from "@/lib/sql-engine/types";

export interface PracticeOfferState {
	exerciseId: string;
	action: PracticeAction;
	reason: string;
	signals: PracticeSignals;
}

export interface PracticeOfferView {
	action: PracticeAction;
	reason: string;
	signals: PracticeSignals;
}

export interface ExerciseWorkspaceViewModel {
	sqlText: string;
	tables: TableInfo[];
	busy: "run" | "submit" | null;
	result: QueryResult | null;
	expected: QueryResult | null;
	grade: GradeReport | null;
	sqlError: string | null;
	diffReplayKey: number;
	walk: WalkResponse | null;
	predicted: ConfidenceLevel | null;
	accepted: boolean;
	offer: PracticeOfferView | null;
	adaptiveNext: { id: string | null; label: string };
	recordingAttempt: boolean;
	skipping: boolean;
	queueFetching: boolean;
	hintSql: string | null;
}

export interface ExerciseWorkspaceActions {
	changeSql: (value: string) => void;
	run: () => void;
	submit: () => void;
	skip: () => void;
	setPrediction: (value: ConfidenceLevel | null) => void;
	resolveSuggestion: (accepted: boolean) => void;
	registerWalk: (controller: WalkController | null) => void;
}

export interface ExerciseWorkspaceViewProps {
	entry: ExerciseWithLesson;
	workspaceRef: RefObject<HTMLDivElement | null>;
	view: ExerciseWorkspaceViewModel;
	actions: ExerciseWorkspaceActions;
}

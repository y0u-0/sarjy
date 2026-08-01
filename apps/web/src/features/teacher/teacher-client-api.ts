import type { TeacherAuditApi } from "./teacher-audit";

export const LEARNING_SIGNAL_KINDS = [
	"asked-for-answer",
	"requested-more-practice",
	"requested-to-move-on",
	"reported-confusion",
] as const;

export type LearningSignalKind = (typeof LEARNING_SIGNAL_KINDS)[number];

type RecordedSignalKind =
	| LearningSignalKind
	| "explained-correctly"
	| "explained-incorrectly";

export interface TeacherClientApi extends TeacherAuditApi {
	practice: TeacherAuditApi["practice"] & {
		recordSignal: (input: {
			conversationId: string;
			kind: RecordedSignalKind;
			concept: string;
			rationale: string | null;
		}) => Promise<unknown>;
	};
	learner: {
		remember: (input: { key: string; value: string }) => Promise<unknown>;
		recall: (input: { query: string }) => Promise<string>;
	};
}

export function isLearningSignalKind(
	value: string,
): value is LearningSignalKind {
	return LEARNING_SIGNAL_KINDS.some((kind) => kind === value);
}

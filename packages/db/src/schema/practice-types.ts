export const CONFIDENCE_LEVELS = ["sure", "unsure"] as const;

export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const EXERCISE_QUEUE_STATUSES = [
	"active",
	"passed",
	"skipped",
	"retired",
] as const;

export type ExerciseQueueStatus = (typeof EXERCISE_QUEUE_STATUSES)[number];

export const STARTING_POINT_LEVELS = [
	"new",
	"foundations",
	"intermediate",
	"advanced",
] as const;

export type StartingPointLevel = (typeof STARTING_POINT_LEVELS)[number];

export const STARTING_POINT_SOURCES = ["interview"] as const;

export type StartingPointSource = (typeof STARTING_POINT_SOURCES)[number];

export const SESSION_INSIGHT_KINDS = [
	"asked-for-answer",
	"explained-correctly",
	"explained-incorrectly",
	"requested-more-practice",
	"requested-to-move-on",
	"reported-confusion",
] as const;

export type SessionInsightKind = (typeof SESSION_INSIGHT_KINDS)[number];

export const TEACHER_QUALITY_EVENTS = [
	"interpretation-recorded",
	"guidance-selected",
	"plan-revealed",
	"observation-recorded",
	"data-observation-recorded",
	"prediction-asked",
	"prediction-recorded",
	"change-applied",
	"correctness-recorded",
	"comparison-recorded",
	"alternatives-revealed",
	"alternatives-reviewed",
	"teachback-correct",
	"teachback-incorrect",
	"problem-selected",
	"problem-skipped",
	"guard-blocked",
	"agent-response",
	"session-ended",
] as const;

export type TeacherQualityEvent = (typeof TEACHER_QUALITY_EVENTS)[number];

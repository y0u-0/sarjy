import type { HintLevel } from "./teacher-types";

export type TeacherHintEvent = "spoken-hint" | "full-solution-request";

export interface TeacherHintRequest {
	exerciseId: string;
	level: HintLevel;
	sql?: string;
}

export interface TeacherHintPolicy {
	activateExercise: (exerciseId: string) => void;
	noteLearnerTurn: () => void;
	getLearnerTurn: () => number;
	record: (event: TeacherHintEvent, exerciseId: string) => string;
	blockReason: (request: TeacherHintRequest) => string | null;
}

export function createTeacherHintPolicy(): TeacherHintPolicy {
	let activeExerciseId: string | null = null;
	let learnerTurn = 0;
	let fullSolutionExerciseId: string | null = null;
	let spokenHintExerciseId: string | null = null;
	let spokenHintLearnerTurn: number | null = null;

	return {
		activateExercise: (exerciseId) => {
			if (activeExerciseId === exerciseId) return;
			activeExerciseId = exerciseId;
			fullSolutionExerciseId = null;
			spokenHintExerciseId = null;
			spokenHintLearnerTurn = null;
		},
		noteLearnerTurn: () => {
			learnerTurn += 1;
		},
		getLearnerTurn: () => learnerTurn,
		record: (event, exerciseId) => {
			if (activeExerciseId !== exerciseId) {
				return "BLOCKED: That help belongs to an exercise that is no longer open.";
			}
			if (event === "full-solution-request") {
				fullSolutionExerciseId = exerciseId;
				return "Full solution authorized for this exercise.";
			}
			spokenHintExerciseId = exerciseId;
			spokenHintLearnerTurn = learnerTurn;
			return "Voice hint recorded. Wait for the learner to try or respond before showing editor help.";
		},
		blockReason: ({ exerciseId, level, sql }) => {
			if (activeExerciseId !== exerciseId) {
				return "BLOCKED: That hint belongs to an exercise that is no longer open.";
			}
			if (level === "solution") {
				if (fullSolutionExerciseId !== exerciseId) {
					return "BLOCKED: The learner must explicitly ask for the full solution to this exact exercise first.";
				}
				if (!sql || sql.includes("?")) {
					return "BLOCKED: A requested full solution must be complete SQL with no ? blank.";
				}
				return null;
			}
			if (level === "nudge") {
				return "BLOCKED: Give the first nudge by voice instead of changing the editor.";
			}
			if (
				spokenHintExerciseId !== exerciseId ||
				spokenHintLearnerTurn === null
			) {
				return "BLOCKED: Give one short voice hint first, without changing the editor.";
			}
			if (learnerTurn <= spokenHintLearnerTurn) {
				return "BLOCKED: Let the learner try or respond to the voice hint before showing editor help.";
			}
			if (!sql || (sql.match(/\?/g)?.length ?? 0) !== 1) {
				return "BLOCKED: An editor rewrite must keep exactly one ? blank for the learner to fill.";
			}
			return null;
		},
	};
}

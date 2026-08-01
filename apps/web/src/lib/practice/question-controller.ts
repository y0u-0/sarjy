export const QUESTION_NOT_OPEN =
	"No Learn question is open. Ask the student to open one of their three assigned questions first.";

/** The narrow screen-control surface available to Sarjy on a Learn exercise. */
export interface QuestionController {
	/**
	 * Resolve the exact exercise the agent saw and open its adaptive replacement.
	 * The exercise id prevents a delayed tool call from skipping a newer question.
	 */
	moveNext(exerciseId: string, reason: string): Promise<string>;
}

export interface AssignedQuestion {
	exerciseId: string;
	slot: number;
}

export interface SubmissionEvidenceDecision {
	/** Whether this result belongs in the learner model. */
	record: boolean;
	/** Acceptance is sticky after the first successful submission. */
	accepted: boolean;
}

/**
 * Record every attempt through the first success. Once accepted, later runs are
 * a consequence-free sandbox: they can be graded but cannot change evidence.
 */
export function decideSubmissionEvidence(
	acceptedBeforeSubmit: boolean,
	passedNow: boolean,
): SubmissionEvidenceDecision {
	return {
		record: !acceptedBeforeSubmit,
		accepted: acceptedBeforeSubmit || passedNow,
	};
}

/** Exercise feedback must never survive navigation to a different assignment. */
export function isEvidenceForCurrentExercise(
	evidenceExerciseId: string,
	currentExerciseId: string,
): boolean {
	return evidenceExerciseId === currentExerciseId;
}

/**
 * Prefer the replacement in the current card's slot, then fall back to the first
 * other assigned question. The current id is never returned, even if a stale
 * queue response still contains it.
 */
export function nextAssignedQuestionId(
	queue: AssignedQuestion[],
	currentExerciseId: string,
	preferredSlot: number | null,
): string | null {
	const alternatives = queue.filter(
		(item) => item.exerciseId !== currentExerciseId,
	);
	if (preferredSlot !== null) {
		const replacement = alternatives.find(
			(item) => item.slot === preferredSlot,
		);
		if (replacement) return replacement.exerciseId;
	}
	return alternatives[0]?.exerciseId ?? null;
}

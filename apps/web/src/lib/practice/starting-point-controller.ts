export const STARTING_POINT_NOT_OPEN =
	"The starting-point interview is not open. Do not estimate a level from another screen.";

interface StartingPointQuestionAssignment {
	exerciseId: string;
	slot: number;
}

export type StartingPointWrapUpPhase =
	| "waiting-for-silence"
	| "waiting-for-speech"
	| "speaking"
	| "ready";

export function startingPointCompletionBlocker(
	answerCount: number,
): string | null {
	if (answerCount >= 3) return null;
	const remaining = 3 - answerCount;
	return remaining === 1
		? "The interview needs three answers. Ask one more question and wait for the learner's full answer before finishing."
		: `The interview needs three answers. Ask ${remaining} more questions, one at a time, and wait for each full answer before finishing.`;
}

export function nextStartingPointWrapUpPhase(
	phase: StartingPointWrapUpPhase,
	isSpeaking: boolean,
): StartingPointWrapUpPhase {
	if (phase === "waiting-for-silence" && !isSpeaking) {
		return "waiting-for-speech";
	}
	if (phase === "waiting-for-speech" && isSpeaking) return "speaking";
	if (phase === "speaking" && !isSpeaking) return "ready";
	return phase;
}

export function firstStartingPointQuestionId(
	questions: readonly StartingPointQuestionAssignment[],
): string {
	const firstQuestion = questions.reduce<
		StartingPointQuestionAssignment | undefined
	>(
		(first, question) =>
			first === undefined || question.slot < first.slot ? question : first,
		undefined,
	);
	if (!firstQuestion) {
		throw new Error(
			"Starting-point placement did not produce an assigned question.",
		);
	}
	return firstQuestion.exerciseId;
}

/** Persist placement, publish the new queue, then replace the interview with question one. */
export async function concludeStartingPointInterview<
	Result extends { questions: readonly StartingPointQuestionAssignment[] },
>(params: {
	complete: () => Promise<Result>;
	publish: (result: Result) => void;
	openQuestion: (exerciseId: string) => Promise<void> | void;
}): Promise<Result> {
	const result = await params.complete();
	const firstQuestionId = firstStartingPointQuestionId(result.questions);

	params.publish(result);
	await params.openQuestion(firstQuestionId);
	return result;
}

/** The one screen-scoped action Sarjy may take after the short interview. */
export interface StartingPointController {
	complete(level: string, rationale: string): Promise<string>;
}

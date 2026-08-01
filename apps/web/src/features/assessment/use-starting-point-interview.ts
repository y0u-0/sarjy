import {
	isStartingPointLevel,
	STARTING_POINT_LABELS,
	type StartingPointLevel,
} from "@sarjy-sql/api/lib/starting-point";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { useTeacher } from "@/components/teacher/teacher-provider";
import {
	concludeStartingPointInterview,
	firstStartingPointQuestionId,
	nextStartingPointWrapUpPhase,
	type StartingPointWrapUpPhase,
	startingPointCompletionBlocker,
} from "@/lib/practice/starting-point-controller";
import { orpc } from "@/utils/orpc";

const WRAP_UP_FALLBACK_MS = 12_000;

export function useStartingPointInterview({
	enabled,
	teacher,
}: {
	enabled: boolean;
	teacher: ReturnType<typeof useTeacher>;
}) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const queueOptions = orpc.practice.queue.queryOptions();
	const startingPointOptions = orpc.practice.startingPoint.queryOptions();
	const completion = useMutation(
		orpc.practice.completeStartingPoint.mutationOptions(),
	);
	const pendingTransition = useRef<null | (() => Promise<void>)>(null);
	const [wrapUpPhase, setWrapUpPhase] =
		useState<StartingPointWrapUpPhase | null>(null);
	const answerCount = teacher.transcript.filter(
		(entry) => entry.role === "user" && entry.text.trim().length > 0,
	).length;

	const revealQuestions = useCallback(async () => {
		const transition = pendingTransition.current;
		if (!transition) return;
		pendingTransition.current = null;
		setWrapUpPhase(null);
		try {
			await transition();
		} catch {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: queueOptions.queryKey }),
				queryClient.invalidateQueries({
					queryKey: startingPointOptions.queryKey,
				}),
			]);
		}
	}, [queryClient, queueOptions.queryKey, startingPointOptions.queryKey]);

	const prepareTransition = useCallback(
		async (level: StartingPointLevel, rationale: string) => {
			const result = await completion.mutateAsync({ level, rationale });
			firstStartingPointQuestionId(result.questions);
			pendingTransition.current = async () => {
				await concludeStartingPointInterview({
					complete: async () => result,
					publish: (saved) => {
						queryClient.setQueryData(queueOptions.queryKey, saved.questions);
						queryClient.setQueryData(startingPointOptions.queryKey, {
							kind: "ready" as const,
							...saved.startingPoint,
						});
					},
					openQuestion: (exerciseId) =>
						navigate({
							to: "/learn/$exerciseId",
							params: { exerciseId },
						}),
				});
			};
			setWrapUpPhase(
				teacher.isSpeaking ? "waiting-for-silence" : "waiting-for-speech",
			);
			return result;
		},
		[
			completion.mutateAsync,
			navigate,
			queryClient,
			queueOptions.queryKey,
			startingPointOptions.queryKey,
			teacher.isSpeaking,
		],
	);

	const completeInterview = useCallback(
		async (levelValue: string, rationaleValue: string) => {
			const blocker = startingPointCompletionBlocker(answerCount);
			if (blocker) return blocker;
			if (pendingTransition.current) {
				return "The starting point is already saved. Finish the short spoken recap; the first question will open when you stop speaking.";
			}
			if (!isStartingPointLevel(levelValue)) {
				return "Choose exactly one level: new, foundations, intermediate, or advanced.";
			}
			const rationale = rationaleValue.trim();
			if (!rationale) {
				return "Give one short rationale based on what the learner actually said.";
			}
			try {
				const result = await prepareTransition(levelValue, rationale);
				return result.created
					? `Starting point saved as ${STARTING_POINT_LABELS[levelValue]}. Give a warm two-sentence recap of what the learner said and what the first questions will focus on. The screen will open question 1 after you finish speaking.`
					: "The starting point was already saved. Give a short spoken recap; question 1 will open after you finish speaking.";
			} catch {
				return "The starting point could not be saved. Keep the interview open and ask the learner to try again.";
			}
		},
		[answerCount, prepareTransition],
	);

	useEffect(() => {
		if (!wrapUpPhase) return;
		const nextPhase = nextStartingPointWrapUpPhase(
			wrapUpPhase,
			teacher.isSpeaking,
		);
		if (nextPhase === "ready") {
			void revealQuestions();
			return;
		}
		if (nextPhase !== wrapUpPhase) setWrapUpPhase(nextPhase);
	}, [revealQuestions, teacher.isSpeaking, wrapUpPhase]);

	const hasPendingTransition = wrapUpPhase !== null;
	useEffect(() => {
		if (!hasPendingTransition) return;
		const timeout = window.setTimeout(
			() => void revealQuestions(),
			WRAP_UP_FALLBACK_MS,
		);
		return () => window.clearTimeout(timeout);
	}, [hasPendingTransition, revealQuestions]);

	useEffect(() => {
		if (!enabled) return;
		teacher.registerStartingPoint({ complete: completeInterview });
		return () => teacher.registerStartingPoint(null);
	}, [completeInterview, enabled, teacher.registerStartingPoint]);
}

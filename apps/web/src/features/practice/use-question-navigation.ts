import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import type { useTeacher } from "@/components/teacher/teacher-provider";
import { getExercise } from "@/lib/curriculum";
import type { ExerciseWithLesson } from "@/lib/curriculum/types";
import { nextAssignedQuestionId } from "@/lib/practice/question-controller";
import { client, orpc } from "@/utils/orpc";

export function useQuestionNavigation({
	entry,
	accepted,
	busy,
	recording,
	clearOffer,
	setSqlError,
	teacher,
}: {
	entry: ExerciseWithLesson;
	accepted: boolean;
	busy: boolean;
	recording: boolean;
	clearOffer: () => void;
	setSqlError: (message: string | null) => void;
	teacher: ReturnType<typeof useTeacher>;
}) {
	const { exercise, lesson } = entry;
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const queueOptions = orpc.practice.queue.queryOptions();
	const queue = useQuery(queueOptions);
	const assignedSlotRef = useRef<number | null>(null);
	const skip = useMutation(
		orpc.practice.skip.mutationOptions({
			onError: () => {
				setSqlError(
					"This question could not be skipped. Reload and try again.",
				);
			},
		}),
	);

	useEffect(() => {
		const assignment = queue.data?.find(
			(item) => item.exerciseId === exercise.id,
		);
		if (assignment) assignedSlotRef.current = assignment.slot;
	}, [exercise.id, queue.data]);

	const moveNext = useCallback(
		async (requestedExerciseId: string, reason: string) => {
			if (requestedExerciseId !== exercise.id) {
				return `That move request is stale. The open exercise is now "${exercise.id}".`;
			}
			if (busy || recording || skip.isPending) {
				return "The current question is still saving. Wait for it to finish, then move it.";
			}
			clearOffer();
			try {
				const nextQueue = accepted
					? await client.practice.queue()
					: await skip.mutateAsync({ exerciseId: exercise.id });
				queryClient.setQueryData(queueOptions.queryKey, nextQueue);
				const nextId = nextAssignedQuestionId(
					nextQueue,
					exercise.id,
					assignedSlotRef.current,
				);
				if (!nextId) {
					await navigate({ to: "/learn" });
					return "The current question was resolved, but there is no replacement to open yet. Showing the assigned-question screen.";
				}
				const nextEntry = getExercise(nextId);
				teacher.observe(
					`Sarjy moved the learner from "${exercise.title}" to the adaptive replacement${reason ? ` because ${reason}` : ""}.`,
				);
				await navigate({
					to: "/learn/$exerciseId",
					params: { exerciseId: nextId },
				});
				return `Moved to "${nextEntry?.exercise.title ?? nextId}". The previous exercise evidence panel is gone.`;
			} catch {
				return "The question could not be moved right now. It is still open, so no assignment was lost.";
			}
		},
		[
			accepted,
			busy,
			clearOffer,
			exercise.id,
			exercise.title,
			navigate,
			queryClient,
			queueOptions.queryKey,
			recording,
			skip.isPending,
			skip.mutateAsync,
			teacher.observe,
		],
	);

	useEffect(() => {
		teacher.registerQuestion({ moveNext });
		return () => teacher.registerQuestion(null);
	}, [moveNext, teacher.registerQuestion]);

	const handleSkip = useCallback(async () => {
		if (busy || recording || skip.isPending) return;
		if (accepted) {
			await moveNext(
				exercise.id,
				"the learner chose the next assigned question",
			);
			return;
		}
		clearOffer();
		teacher.observe(
			`The student skipped "${exercise.title}". Treat this as evidence that ${lesson.title} needs a different question shape, not as mastery.`,
		);
		try {
			const nextQueue = await skip.mutateAsync({ exerciseId: exercise.id });
			queryClient.setQueryData(queueOptions.queryKey, nextQueue);
			await navigate({ to: "/learn" });
		} catch {
			// The mutation's error path keeps the current assignment recoverable.
		}
	}, [
		accepted,
		busy,
		clearOffer,
		exercise.id,
		exercise.title,
		lesson.title,
		moveNext,
		navigate,
		queryClient,
		queueOptions.queryKey,
		recording,
		skip.isPending,
		skip.mutateAsync,
		teacher.observe,
	]);

	return { queue, skipping: skip.isPending, handleSkip };
}

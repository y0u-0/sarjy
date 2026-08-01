import type { ConfidenceLevel } from "@sarjy-sql/api/lib/practice-policy";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { useTeacher } from "@/components/teacher/teacher-provider";
import type { ExerciseWithLesson } from "@/lib/curriculum/types";
import {
	decideSubmissionEvidence,
	isEvidenceForCurrentExercise,
} from "@/lib/practice/question-controller";
import type { GradeReport, QueryResult } from "@/lib/sql-engine/types";
import { orpc } from "@/utils/orpc";

import type { PracticeOfferState } from "./exercise-workspace-types";
import type { SubmissionResponse } from "./use-exercise-runtime";

function previewRows(result: QueryResult): string {
	return JSON.stringify(result.rows.slice(0, 3));
}

export function usePracticeEvidence({
	entry,
	teacher,
	setGrade,
	setSqlError,
}: {
	entry: ExerciseWithLesson;
	teacher: ReturnType<typeof useTeacher>;
	setGrade: (grade: GradeReport | null) => void;
	setSqlError: (message: string | null) => void;
}) {
	const { exercise, lesson } = entry;
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const queueOptions = orpc.practice.queue.queryOptions();
	const [predicted, setPredicted] = useState<ConfidenceLevel | null>(null);
	const [offer, setOffer] = useState<PracticeOfferState | null>(null);
	const [hintUsed, setHintUsed] = useState(false);
	const [solutionUsed, setSolutionUsed] = useState(false);
	const [accepted, setAccepted] = useState(false);
	const acceptedRef = useRef(false);
	const attemptStartedAt = useRef(Date.now());
	acceptedRef.current = accepted;

	useEffect(() => {
		attemptStartedAt.current = Date.now();
		setPredicted(null);
		setOffer(null);
		setHintUsed(false);
		setSolutionUsed(false);
	}, []);

	const recommend = useMutation(orpc.practice.recommend.mutationOptions());
	const requestRecommendation = useCallback(() => {
		const requestedExerciseId = exercise.id;
		recommend.mutate(
			{ concept: lesson.id, poolIds: [] },
			{
				onSuccess: (data) => {
					setOffer({
						exerciseId: requestedExerciseId,
						action: data.recommendation.action,
						reason: data.recommendation.reason,
						signals: data.signals,
					});
				},
			},
		);
	}, [exercise.id, lesson.id, recommend.mutate]);

	const recordAttempt = useMutation(
		orpc.progress.recordAttempt.mutationOptions({
			onSuccess: async (data, variables) => {
				void queryClient.invalidateQueries(orpc.progress.list.queryOptions());
				if (data.state === "not-active") {
					await queryClient.invalidateQueries(queueOptions);
					await navigate({ to: "/learn" });
					return;
				}
				requestRecommendation();
				if (variables.passed) await queryClient.invalidateQueries(queueOptions);
			},
			onError: () => {
				if (acceptedRef.current) {
					acceptedRef.current = false;
					setAccepted(false);
				}
				setGrade(null);
				setSqlError(
					"Your result was checked, but it could not be saved. Submit once more.",
				);
			},
		}),
	);

	useEffect(() => {
		if (teacher.evidenceRevision === 0) return;
		requestRecommendation();
	}, [teacher.evidenceRevision, requestRecommendation]);

	const recordSubmission = useCallback(
		(response: SubmissionResponse, sql: string) => {
			const acceptedBeforeSubmit = acceptedRef.current;
			const evidence = decideSubmissionEvidence(
				acceptedBeforeSubmit,
				response.grade.pass,
			);
			if (evidence.accepted !== acceptedBeforeSubmit) {
				acceptedRef.current = evidence.accepted;
				setAccepted(evidence.accepted);
			}
			if (evidence.record) {
				recordAttempt.mutate({
					exerciseId: exercise.id,
					concept: lesson.id,
					sql,
					passed: response.grade.pass,
					kind:
						response.grade.status === "correct" ? null : response.grade.status,
					elapsedMs: Date.now() - attemptStartedAt.current,
					predicted,
					hintShown: hintUsed || teacher.hint?.sql != null,
					gaveUp: solutionUsed,
				});
			}
			attemptStartedAt.current = Date.now();
			setPredicted(null);
			setHintUsed(false);
			setSolutionUsed(false);
			teacher.observe(
				evidence.record
					? response.grade.pass
						? `The student submitted and PASSED "${exercise.title}". Their SQL:\n${sql}`
						: `The student submitted "${exercise.title}" and did not pass. Feedback shown: ${response.grade.message}\nTheir SQL:\n${sql}\nTheir result: ${response.result.rowCount} row(s), columns [${response.result.columns.join(", ")}], first rows ${previewRows(response.result)}`
					: `The learner tested another solution after "${exercise.title}" was already accepted. It ${response.grade.pass ? "passed" : "did not pass"}, but this sandbox result was not added to their learner evidence. Their SQL:\n${sql}`,
			);
		},
		[
			exercise.id,
			exercise.title,
			hintUsed,
			lesson.id,
			predicted,
			recordAttempt.mutate,
			solutionUsed,
			teacher.hint?.sql,
			teacher.observe,
		],
	);

	const activeOffer =
		offer && isEvidenceForCurrentExercise(offer.exerciseId, exercise.id)
			? offer
			: null;
	const clearOffer = useCallback(() => setOffer(null), []);
	const resolveSuggestion = useCallback(
		(used: boolean) => {
			if (used) {
				setHintUsed(true);
				setSolutionUsed(teacher.hint?.level === "solution");
			}
			teacher.dismissHint(used ? "accepted" : "dismissed");
		},
		[teacher.dismissHint, teacher.hint?.level],
	);

	return {
		state: {
			predicted,
			offer: activeOffer,
			accepted,
			recording: recordAttempt.isPending,
		},
		actions: {
			setPredicted,
			clearOffer,
			recordSubmission,
			resolveSuggestion,
		},
	};
}

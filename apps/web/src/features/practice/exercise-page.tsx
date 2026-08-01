import { useCallback, useRef } from "react";

import { useTeacher } from "@/components/teacher/teacher-provider";
import { useTextSelection } from "@/hooks/use-text-selection";
import type { ExerciseWithLesson } from "@/lib/curriculum/types";

import { ExerciseWorkspaceView } from "./exercise-workspace-view";
import { useExerciseObservations } from "./use-exercise-observations";
import { useExerciseRuntime } from "./use-exercise-runtime";
import { usePracticeEvidence } from "./use-practice-evidence";
import { useQuestionNavigation } from "./use-question-navigation";

export function ExercisePage({ entry }: { entry: ExerciseWithLesson }) {
	return <ExerciseWorkspace key={entry.exercise.id} entry={entry} />;
}

function ExerciseWorkspace({ entry }: { entry: ExerciseWithLesson }) {
	const { exercise } = entry;
	const teacher = useTeacher();
	const workspaceRef = useRef<HTMLDivElement>(null);
	const selection = useTextSelection(workspaceRef);
	const runtime = useExerciseRuntime({
		referenceSql: exercise.referenceSql,
		observe: teacher.observe,
	});
	const evidence = usePracticeEvidence({
		entry,
		teacher,
		setGrade: runtime.actions.setGrade,
		setSqlError: runtime.actions.setSqlError,
	});
	const navigation = useQuestionNavigation({
		entry,
		accepted: evidence.state.accepted,
		busy: runtime.state.busy !== null,
		recording: evidence.state.recording,
		clearOffer: evidence.actions.clearOffer,
		setSqlError: runtime.actions.setSqlError,
		teacher,
	});

	useExerciseObservations({
		entry,
		sqlText: runtime.state.sqlText,
		selectionText: selection?.text,
		teacher,
	});

	const submit = useCallback(async () => {
		if (
			runtime.state.busy ||
			evidence.state.recording ||
			!runtime.state.sqlText.trim()
		)
			return;
		if (evidence.state.accepted) evidence.actions.clearOffer();
		const response = await runtime.actions.submit(exercise.ordered);
		if (response) {
			evidence.actions.recordSubmission(response, runtime.state.sqlText);
		}
	}, [
		evidence.actions,
		evidence.state.accepted,
		evidence.state.recording,
		exercise.ordered,
		runtime.actions,
		runtime.state.busy,
		runtime.state.sqlText,
	]);

	const adaptiveNext = getAdaptiveNext({
		currentExerciseId: exercise.id,
		passed: runtime.state.grade?.pass ?? false,
		offerAction: evidence.state.offer?.action ?? null,
		recording: evidence.state.recording,
		queueFetching: navigation.queue.isFetching,
		queue: navigation.queue.data,
	});

	return (
		<ExerciseWorkspaceView
			entry={entry}
			workspaceRef={workspaceRef}
			view={{
				...runtime.state,
				predicted: evidence.state.predicted,
				accepted: evidence.state.accepted,
				offer: evidence.state.offer,
				adaptiveNext,
				recordingAttempt: evidence.state.recording,
				skipping: navigation.skipping,
				queueFetching: navigation.queue.isFetching,
				hintSql: teacher.hint?.sql ?? null,
			}}
			actions={{
				changeSql: (value) => {
					runtime.actions.setSqlText(value);
					teacher.notifyActivity();
				},
				run: runtime.actions.run,
				submit: () => void submit(),
				skip: () => void navigation.handleSkip(),
				setPrediction: evidence.actions.setPredicted,
				resolveSuggestion: evidence.actions.resolveSuggestion,
				registerWalk: teacher.registerWalk,
			}}
		/>
	);
}

function getAdaptiveNext({
	currentExerciseId,
	passed,
	offerAction,
	recording,
	queueFetching,
	queue,
}: {
	currentExerciseId: string;
	passed: boolean;
	offerAction: string | null;
	recording: boolean;
	queueFetching: boolean;
	queue: Array<{ exerciseId: string }> | undefined;
}) {
	if (!passed || !offerAction || recording || queueFetching) {
		return { id: null, label: "Next assigned question" };
	}
	if (offerAction === "consolidate") {
		return { id: null, label: "Explain this first" };
	}
	return {
		id:
			queue?.find((item) => item.exerciseId !== currentExerciseId)
				?.exerciseId ?? null,
		label: "Next assigned question",
	};
}

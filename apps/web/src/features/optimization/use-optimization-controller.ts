import { useQueryClient } from "@tanstack/react-query";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { optimizationDatasets } from "@/lib/curriculum/optimization-bank";
import { lessonPresentation } from "@/lib/optimize/lesson-presentation";
import { useOptimizationSession } from "./optimization-session";
import { useOptimizationTeacherContext } from "./optimization-teacher-bridge";
import { useOptimizationCanvasActions } from "./use-optimization-canvas-actions";
import { useOptimizationCheckpoints } from "./use-optimization-checkpoints";
import { useOptimizationEditorAction } from "./use-optimization-editor-action";
import { useOptimizationIndexActions } from "./use-optimization-index-actions";
import { useOptimizationLabController } from "./use-optimization-lab-controller";
import { useOptimizationMeasurements } from "./use-optimization-measurements";
import { useOptimizationProblemActions } from "./use-optimization-problem-actions";
import { useOptimizationReviewActions } from "./use-optimization-review-actions";
import { useOptimizationRewriteActions } from "./use-optimization-rewrite-actions";
import { useOptimizationState } from "./use-optimization-state";
import { useOptimizationSurface } from "./use-optimization-surface";
import { useOptimizationTimelineActions } from "./use-optimization-timeline-actions";
import { useOptimizationTimelineState } from "./use-optimization-timeline-state";

export function useOptimizationController() {
	const queryClient = useQueryClient();
	const reducedMotion = useReducedMotion();
	const state = useOptimizationState();
	const session = useOptimizationSession(state.problem.id);
	const teacher = useOptimizationTeacherContext(
		state.problem,
		optimizationDatasets[state.problem.datasetId].schemaSummary,
	);
	const revealSurface = useOptimizationSurface(state, reducedMotion);
	const measurements = useOptimizationMeasurements(state, queryClient);
	const timeline = useOptimizationTimelineState(state, reducedMotion);

	const selectProblem = useOptimizationProblemActions(
		state,
		session,
		queryClient,
		reducedMotion,
		revealSurface,
	);
	const checkpoints = useOptimizationCheckpoints(state, session);
	const applyIndex = useOptimizationIndexActions({
		state,
		session,
		revealComparison: (note) => revealSurface("comparison", note),
		loadBaseline: measurements.loadBaseline,
		logAttempt: measurements.logAttempt,
		observe: teacher.observe,
	});
	const applyRewrite = useOptimizationRewriteActions({
		state,
		session,
		revealComparison: (note) => revealSurface("comparison", note),
		logAttempt: measurements.logAttempt,
		observe: teacher.observe,
	});
	const canvas = useOptimizationCanvasActions({
		state,
		session,
		reducedMotion,
		revealSurface,
		loadBaseline: measurements.loadBaseline,
		observe: teacher.observe,
	});
	const review = useOptimizationReviewActions({
		state,
		session,
		queryClient,
		revealSurface,
		loadBaseline: measurements.loadBaseline,
		observe: teacher.observe,
		timelineFind: (id) =>
			timeline.timelineRef.current.findIndex((step) => step.id === id),
	});
	const timelineActions = useOptimizationTimelineActions({
		state,
		timeline,
		session,
		reducedMotion,
		isSpeaking: teacher.isSpeaking,
		revealSurface,
	});
	const askSarjyToMeasure = useOptimizationEditorAction(state, teacher.ask);
	const presentation = lessonPresentation(session.state);

	useOptimizationLabController({
		problem: { selectProblem },
		checkpoints,
		canvas,
		changes: { applyIndex, applyRewrite },
		review,
		timeline: {
			timelineStepTo: timelineActions.stepTo,
			timelineNext: timelineActions.next,
			timelinePrevious: timelineActions.previous,
			timelinePlay: timelineActions.play,
			timelinePause: timelineActions.pause,
			timelineRestart: timelineActions.restart,
			timelineSetSpeed: timelineActions.setSpeed,
			timelineSpeechStarted: timelineActions.speechStarted,
			timelineSpeechEnded: timelineActions.speechEnded,
			timelineDescribe: timelineActions.describe,
		},
	});

	const showingCandidate =
		state.candidate !== null &&
		["candidate-plan", "candidate-rows", "compare-work", "reflect"].includes(
			timeline.activeStep?.id ?? "",
		);
	const shown = showingCandidate ? state.candidate : state.baseline;
	const visibleMeasurement =
		state.surface === "comparison"
			? (state.candidate ?? shown ?? state.baseline)
			: (shown ?? state.baseline);
	const visibleDiff =
		visibleMeasurement === state.candidate
			? state.diff
			: showingCandidate
				? state.diff
				: null;
	const taskRevealed = session.state.interpretationCorrect === true;
	return {
		lessonHeader: {
			taskRevealed,
		},
		canvas: {
			lessonPresentation: presentation,
			responseGate: session.state.awaitingResponse,
			lessonCheckpoint: session.state.checkpoint,
			surface: state.surface,
			activeStep: timeline.activeStep,
			guidedNote: presentation.prompt,
			busy: state.busy,
			prediction: state.prediction,
			problem: state.problem,
			baseline: state.baseline,
			candidate: state.candidate,
			visibleMeasurement,
			visibleDiff,
			focusedId: state.focus?.id ?? timeline.activeStep?.planNodeId ?? null,
			focusNote: state.focus?.note ?? timeline.activeStep?.description ?? null,
			replayKey: state.replayKey,
			operatorPlayback:
				state.surface === "animation" ? state.visualPlayback : "complete",
			alternativesVisible: state.alternativesVisible,
			outcome: state.outcome,
		},
		editor: {
			problem: state.problem,
			prediction: state.prediction,
			isAuthoring: session.state.awaitingResponse === "change",
			indexSql: state.indexSql,
			onIndexSqlChange: state.setIndexSql,
			rewriteSql: state.rewriteSql,
			onRewriteSqlChange: state.setRewriteSql,
			tables: state.tables,
			busy: state.busy,
			activeIndexCount: state.indexes.length,
			onMeasure: askSarjyToMeasure,
		},
	} as const;
}

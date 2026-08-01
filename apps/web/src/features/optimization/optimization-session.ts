import { useCallback, useMemo, useRef, useState } from "react";

import {
	createOptimizationLesson,
	type OptimizationLessonAction,
	type OptimizationLessonState,
	type OptimizationLessonTransition,
	transitionOptimizationLesson,
} from "@/lib/optimize/lesson-session";

export interface OptimizationSession {
	state: OptimizationLessonState;
	read: () => OptimizationLessonState;
	dispatch: (action: OptimizationLessonAction) => OptimizationLessonTransition;
	preview: (action: OptimizationLessonAction) => OptimizationLessonTransition;
	commit: (state: OptimizationLessonState) => void;
}

export function useOptimizationSession(problemId: string): OptimizationSession {
	const initial = useRef(createOptimizationLesson(problemId));
	const stateRef = useRef(initial.current);
	const [state, setState] = useState(initial.current);

	const read = useCallback(() => stateRef.current, []);
	const preview = useCallback(
		(action: OptimizationLessonAction) =>
			transitionOptimizationLesson(stateRef.current, action),
		[],
	);
	const commit = useCallback((state: OptimizationLessonState) => {
		stateRef.current = state;
		setState(state);
	}, []);
	const dispatch = useCallback(
		(action: OptimizationLessonAction) => {
			const result = preview(action);
			if (result.accepted) commit(result.state);
			return result;
		},
		[commit, preview],
	);

	return useMemo(
		() => ({ state, read, dispatch, preview, commit }),
		[commit, dispatch, preview, read, state],
	);
}

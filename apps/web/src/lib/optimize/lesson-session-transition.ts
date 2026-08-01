import { transitionLessonCompletion } from "./lesson-session-completion";
import { transitionLessonFoundation } from "./lesson-session-foundation";
import type {
	OptimizationLessonAction,
	OptimizationLessonState,
	OptimizationLessonTransition,
} from "./lesson-session-model";

export function transitionOptimizationLesson(
	state: OptimizationLessonState,
	action: OptimizationLessonAction,
): OptimizationLessonTransition {
	return (
		transitionLessonFoundation(state, action) ??
		transitionLessonCompletion(state, action)
	);
}

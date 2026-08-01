import { OptimizationCanvas } from "./optimization-canvas";
import { OptimizationEditor } from "./optimization-editor";
import { OptimizationLessonHeader } from "./optimization-lesson-header";
import { useOptimizationController } from "./use-optimization-controller";

export function OptimizationPage() {
	const lesson = useOptimizationController();

	return (
		<div className="h-full min-h-0 overflow-y-auto bg-ink px-3 py-4 sm:px-5 sm:py-5">
			<div className="mx-auto max-w-5xl">
				<OptimizationLessonHeader {...lesson.lessonHeader} />
				<OptimizationCanvas {...lesson.canvas} />
				<OptimizationEditor {...lesson.editor} />
			</div>
		</div>
	);
}

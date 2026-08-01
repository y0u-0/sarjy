import type { OptimizationLessonPresentation } from "@/lib/optimize/lesson-presentation";

export function OptimizationCanvasHeader({
	presentation,
}: {
	presentation: OptimizationLessonPresentation;
}) {
	return (
		<div className="flex flex-wrap items-start gap-3 border-border border-b px-4 py-3 sm:px-5">
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-[10px] text-periwinkle uppercase tracking-[0.1em]">
					{presentation.eyebrow}
				</p>
				<h2 className="mt-1 font-bold text-base sm:text-lg">
					{presentation.title}
				</h2>
				<p className="mt-1 max-w-[72ch] text-muted-foreground text-xs leading-relaxed sm:text-sm">
					{presentation.prompt}
				</p>
			</div>
			{presentation.waiting && (
				<span className="rounded-full bg-lime px-2.5 py-1 font-semibold text-[10px] text-ink uppercase tracking-[0.08em]">
					Your turn
				</span>
			)}
		</div>
	);
}

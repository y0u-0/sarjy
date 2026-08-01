import type { ActiveExerciseQueueItem } from "@sarjy-sql/api/lib/practice";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CircleDotDashed } from "lucide-react";

import type { ExerciseWithLesson } from "@/lib/curriculum/types";

interface AdaptiveQuestionCardProps {
	item: ActiveExerciseQueueItem;
	entry: ExerciseWithLesson;
}

export function AdaptiveQuestionCard({
	item,
	entry,
}: AdaptiveQuestionCardProps) {
	return (
		<Link
			to="/learn/$exerciseId"
			params={{ exerciseId: item.exerciseId }}
			className="group flex min-h-56 flex-col rounded-3xl border border-border bg-card p-5 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 hover:border-lime/60 hover:bg-lime/[0.03]"
		>
			<div className="flex items-center justify-between gap-3">
				<span className="font-mono text-muted-foreground text-xs">
					Question {item.slot + 1}
				</span>
				<ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lime" />
			</div>
			<h2 className="mt-6 font-extrabold text-2xl tracking-tight">
				{entry.exercise.title}
			</h2>
			<p className="mt-2 text-muted-foreground text-sm">{entry.lesson.title}</p>
			<p className="mt-auto flex items-start gap-2 pt-5 text-muted-foreground text-xs leading-relaxed">
				<CircleDotDashed className="mt-0.5 size-3.5 shrink-0 text-periwinkle" />
				{item.selectionReason}
			</p>
		</Link>
	);
}

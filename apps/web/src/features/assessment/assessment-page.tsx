import { STARTING_POINT_LABELS } from "@sarjy-sql/api/lib/starting-point";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";

import { useTeacher } from "@/components/teacher/teacher-provider";
import { getExercise } from "@/lib/curriculum";
import { orpc } from "@/utils/orpc";

import { AdaptiveQuestionCard } from "./adaptive-question-card";
import { StartingPointInterview } from "./starting-point-interview";
import { useStartingPointInterview } from "./use-starting-point-interview";

export function AssessmentPage() {
	const teacher = useTeacher();
	const queue = useQuery(orpc.practice.queue.queryOptions());
	const startingPoint = useQuery(orpc.practice.startingPoint.queryOptions());
	const needsInterview = startingPoint.data?.kind === "interview";
	useStartingPointInterview({
		enabled: needsInterview,
		teacher,
	});
	const questions = (queue.data ?? []).flatMap((item) => {
		const entry = getExercise(item.exerciseId);
		return entry ? [{ item, entry }] : [];
	});
	const loading = queue.isPending || startingPoint.isPending;

	useEffect(() => {
		teacher.setScreenContext({
			kind: "assessment",
			title: needsInterview
				? "Starting-point interview"
				: "Your three adaptive questions",
			summary: needsInterview
				? "This learner has no solved practice yet. Ask exactly three short questions, one at a time, about their SQL experience, familiar concepts, and one content-based scenario. Hear the full answer to all three, then acknowledge and recap before calling assessment_finish_interview. Never call the tool in the same turn as question three. Base the estimate only on what they say, never voice delivery."
				: "Only these three assigned exercises are visible. Each completed or skipped card is replaced using graded submissions, explicit voice signals, and teach-back evidence.",
		});
		return () => teacher.setScreenContext(null);
	}, [needsInterview, teacher.setScreenContext]);

	if (needsInterview) {
		return <StartingPointInterview teacher={teacher} />;
	}

	return (
		<div className="h-full overflow-y-auto p-4 sm:p-7 lg:p-10">
			<div className="mx-auto max-w-5xl">
				<div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 font-mono text-lime text-xs">
					<Sparkles className="size-3.5" />
					Adaptive assessment
				</div>
				<h1 className="mt-4 max-w-3xl font-black text-4xl tracking-[-0.04em] sm:text-6xl">
					Three questions.
					<br />
					<span className="text-muted-foreground">Always the right three.</span>
				</h1>
				<p className="mt-5 max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg">
					The first set samples different SQL ideas. From there, every pass,
					skip, explanation, and voice conversation helps Sarjy choose the one
					question that replaces it.
				</p>
				{startingPoint.data?.kind === "ready" && startingPoint.data.level && (
					<div className="mt-5 max-w-2xl rounded-2xl border border-periwinkle/35 bg-periwinkle/10 px-4 py-3 text-sm">
						<span className="font-semibold text-periwinkle">
							Starting point: {STARTING_POINT_LABELS[startingPoint.data.level]}
						</span>
						<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
							{startingPoint.data.rationale} Graded work now decides what
							replaces each card.
						</p>
					</div>
				)}

				<section
					className="mt-9 grid gap-3 lg:grid-cols-3"
					aria-label="Your three questions"
				>
					{loading &&
						[0, 1, 2].map((slot) => (
							<div
								key={slot}
								className="h-56 animate-pulse rounded-3xl border border-border bg-card"
							/>
						))}
					{questions.map(({ item, entry }) => (
						<AdaptiveQuestionCard
							key={item.exerciseId}
							item={item}
							entry={entry}
						/>
					))}
				</section>

				{queue.isError && (
					<div className="mt-6 rounded-2xl border border-tangerine/40 bg-tangerine/10 p-4 text-sm text-tangerine">
						Sarjy couldn’t load your questions. Reload the page to try again.
					</div>
				)}
				{startingPoint.isError && (
					<div className="mt-6 rounded-2xl border border-tangerine/40 bg-tangerine/10 p-4 text-sm text-tangerine">
						Sarjy couldn’t check your starting point. Reload the page to try
						again.
					</div>
				)}
			</div>
		</div>
	);
}

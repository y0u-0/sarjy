import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { ExercisePage } from "@/features/practice/exercise-page";
import { getExercise } from "@/lib/curriculum";

export const Route = createFileRoute("/_auth/learn/$exerciseId")({
	loader: async ({ context, params }) => {
		const entry = getExercise(params.exerciseId);
		if (!entry) throw notFound();

		const queueOptions = context.orpc.practice.queue.queryOptions();
		await context.queryClient.prefetchQuery(queueOptions);
		const queue = context.queryClient.getQueryData(queueOptions.queryKey);
		if (!queue) {
			throw new Error("The assigned question queue could not be loaded.");
		}
		if (!queue.some((item) => item.exerciseId === params.exerciseId)) {
			throw redirect({ to: "/learn" });
		}

		return entry;
	},
	component: ExerciseRoute,
});

function ExerciseRoute() {
	return <ExercisePage entry={Route.useLoaderData()} />;
}

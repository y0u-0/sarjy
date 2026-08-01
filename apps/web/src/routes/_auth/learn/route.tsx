import { createFileRoute } from "@tanstack/react-router";

import { LearnLayout } from "@/features/learn-shell/learn-layout";

export const Route = createFileRoute("/_auth/learn")({
	loader: ({ context }) => {
		if (!context.session) return;
		return Promise.all([
			context.queryClient.prefetchQuery(
				context.orpc.practice.startingPoint.queryOptions(),
			),
			context.queryClient.prefetchQuery(
				context.orpc.practice.queue.queryOptions(),
			),
		]);
	},
	component: LearnLayout,
});

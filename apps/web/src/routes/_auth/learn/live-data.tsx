import { createFileRoute } from "@tanstack/react-router";

import { LiveDataPage } from "@/features/live-data/live-data-page";

export const Route = createFileRoute("/_auth/learn/live-data")({
	component: LiveDataPage,
});

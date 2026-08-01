import { createFileRoute } from "@tanstack/react-router";

import { OptimizationPage } from "@/features/optimization/optimization-page";

export const Route = createFileRoute("/_auth/learn/optimize")({
	component: OptimizationPage,
});

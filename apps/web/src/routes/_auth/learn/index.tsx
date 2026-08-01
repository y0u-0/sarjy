import { createFileRoute } from "@tanstack/react-router";

import { AssessmentPage } from "@/features/assessment/assessment-page";

export const Route = createFileRoute("/_auth/learn/")({
	component: AssessmentPage,
});

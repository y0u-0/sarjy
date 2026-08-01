import { createFileRoute } from "@tanstack/react-router";

import { handleTeacherWebhook } from "@/server/teacher-webhook/handler";

export const Route = createFileRoute("/api/teacher/webhook")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) =>
				handleTeacherWebhook(request),
		},
	},
});

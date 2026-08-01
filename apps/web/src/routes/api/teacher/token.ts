import { composeLearnerVoiceContext } from "@sarjy-sql/api/lib/learner-memory";
import { auth } from "@sarjy-sql/auth";
import { env } from "@sarjy-sql/env/server";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/teacher/token")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				if (!session?.user) {
					return Response.json({ error: "Unauthorized" }, { status: 401 });
				}

				if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_AGENT_ID) {
					return Response.json(
						{
							error:
								"Voice teacher is not configured. Set ELEVENLABS_API_KEY and run `bun run setup:teacher`.",
						},
						{ status: 503 },
					);
				}

				const learnerContext = await composeLearnerVoiceContext(
					session.user.id,
					session.user.name,
				).catch((error: unknown) => {
					console.error("Failed to compose learner brief:", error);
					return {
						learnerBrief: "Memory is unavailable for this session.",
						studentName: session.user.name.trim().split(/\s+/)[0] || "there",
					};
				});

				const response = await fetch(
					`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${env.ELEVENLABS_AGENT_ID}`,
					{ headers: { "xi-api-key": env.ELEVENLABS_API_KEY } },
				);

				if (!response.ok) {
					const body = await response.text();
					console.error(
						`ElevenLabs token request failed (${response.status}): ${body}`,
					);
					if (response.status === 429) {
						return Response.json(
							{
								error:
									"Sarjy is already in another call (plan concurrency limit). Close other tabs or wait a minute, then tap the orb.",
							},
							{ status: 429 },
						);
					}
					return Response.json(
						{ error: "Could not start a teacher session." },
						{ status: 502 },
					);
				}

				const { token } = (await response.json()) as { token?: string };
				if (!token) {
					console.error("ElevenLabs token response was missing token.");
					return Response.json(
						{ error: "Could not start a teacher session." },
						{ status: 502 },
					);
				}
				return Response.json({
					token,
					userId: session.user.id,
					studentName: learnerContext.studentName,
					learnerBrief: learnerContext.learnerBrief,
				});
			},
		},
	},
});

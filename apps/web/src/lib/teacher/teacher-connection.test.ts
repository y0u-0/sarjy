import { describe, expect, test } from "bun:test";

import {
	startTeacherVoiceSession,
	type TeacherVoiceSessionOptions,
	teacherConnectionIssueFromError,
} from "./teacher-connection";

describe("teacher voice connection", () => {
	test("requests microphone access before starting private voice", async () => {
		let stopped = false;
		let options: TeacherVoiceSessionOptions | null = null;

		const result = await startTeacherVoiceSession(
			{
				currentView: "Live data mission",
				lessonTitle: "Live data mission",
				lessonConcept: "Agent-controlled live-data lesson",
				exerciseId: "live-data",
				exerciseTitle: "Live data mission",
				exercisePrompt: "Choose cities, predict, and test with SQL.",
				schemaSummary:
					"weather_hourly(location_id, observed_at, temperature_c)",
			},
			(sessionOptions) => {
				options = sessionOptions;
			},
			{
				getUserMedia: async () => ({
					getTracks: () => [{ stop: () => (stopped = true) }],
				}),
				fetchAccess: async () =>
					new Response(
						JSON.stringify({
							token: "webrtc-token",
							userId: "learner-1",
							studentName: "Captain",
							learnerBrief: "Strong at joins; consolidating windows.",
						}),
						{ status: 200 },
					),
			},
		);

		expect(result).toEqual({ started: true });
		expect(stopped).toBe(true);
		expect(options).toMatchObject({
			conversationToken: "webrtc-token",
			connectionType: "webrtc",
			dynamicVariables: {
				student_name: "Captain",
				user_id: "learner-1",
				current_view: "Live data mission",
				exercise_id: "live-data",
				learner_brief: "Strong at joins; consolidating windows.",
			},
		});
	});

	test("opens the starting-point interview with its first question", async () => {
		let options: TeacherVoiceSessionOptions | null = null;
		const result = await startTeacherVoiceSession(
			{
				currentView: "Starting-point interview",
				lessonTitle: "Starting-point interview",
				lessonConcept: "First-run SQL placement",
				exerciseId: "assessment",
				exerciseTitle: "Starting-point interview",
				exercisePrompt: "Ask at most three short questions.",
				schemaSummary: "record shop schema",
			},
			(sessionOptions) => {
				options = sessionOptions;
			},
			{
				getUserMedia: async () => ({ getTracks: () => [] }),
				fetchAccess: async () =>
					Response.json({
						token: "webrtc-token",
						userId: "learner-1",
						studentName: "Professor Ada",
						learnerBrief: "No graded evidence yet.",
					}),
			},
		);

		expect(result).toEqual({ started: true });
		expect(options).toMatchObject({
			overrides: {
				agent: {
					firstMessage:
						"Hi Professor Ada! Before I choose your first three questions, how have you used SQL before—if at all?",
				},
			},
		});
	});

	test("explains how to recover when microphone access is blocked", async () => {
		let fetched = false;
		let started = false;
		const denied = new DOMException("Permission denied", "NotAllowedError");

		const result = await startTeacherVoiceSession(
			{
				currentView: "Live data mission",
				lessonTitle: "Live data mission",
				lessonConcept: "Live data",
				exerciseId: "live-data",
				exerciseTitle: "Live data mission",
				exercisePrompt: "Choose cities.",
				schemaSummary: "weather_hourly",
			},
			() => {
				started = true;
			},
			{
				getUserMedia: async () => {
					throw denied;
				},
				fetchAccess: async () => {
					fetched = true;
					return new Response();
				},
			},
		);

		expect(result).toEqual({
			started: false,
			issue: {
				title: "Microphone access is blocked",
				detail:
					"Allow microphone access for this site in your browser, then tap Sarjy again.",
			},
		});
		expect(fetched).toBe(false);
		expect(started).toBe(false);
	});

	test("keeps the server's recovery message when voice access is unavailable", async () => {
		const result = await startTeacherVoiceSession(
			{
				currentView: "Learn",
				lessonTitle: "Learn",
				lessonConcept: "Adaptive SQL learning",
				exerciseId: "assessment",
				exerciseTitle: "Learn",
				exercisePrompt: "Learn",
				schemaSummary: "record shop schema",
			},
			() => {
				throw new Error("The session must not start.");
			},
			{
				getUserMedia: async () => ({ getTracks: () => [] }),
				fetchAccess: async () =>
					Response.json(
						{
							error:
								"Sarjy is already in another call. Close the other tab, then retry.",
						},
						{ status: 429 },
					),
			},
		);

		expect(result).toEqual({
			started: false,
			issue: {
				title: "Sarjy couldn't connect",
				detail:
					"Sarjy is already in another call. Close the other tab, then retry.",
			},
		});
	});

	test("turns an unexpected transport close into a retryable explanation", () => {
		expect(
			teacherConnectionIssueFromError(
				"The connection was closed due to a socket error.",
			),
		).toEqual({
			title: "Voice connection dropped",
			detail:
				"The live voice connection ended unexpectedly. Tap Sarjy to reconnect.",
		});
	});

	test("names exhausted ElevenLabs credits instead of looking like a dropped call", () => {
		expect(
			teacherConnectionIssueFromError("This request exceeds your quota limit."),
		).toEqual({
			title: "Voice credits are exhausted",
			detail:
				"ElevenLabs has no voice credits left. Add credits or enable overage, then tap Sarjy again.",
		});
	});
});

export interface TeacherVoiceContext {
	currentView: string;
	lessonTitle: string;
	lessonConcept: string;
	exerciseId: string;
	exerciseTitle: string;
	exercisePrompt: string;
	schemaSummary: string;
}

interface TeacherAccess {
	token: string;
	userId: string;
	studentName: string;
	learnerBrief: string;
}

interface StoppableMediaStream {
	getTracks: () => Array<{ stop: () => void }>;
}

export interface TeacherVoiceSessionOptions {
	conversationToken: string;
	connectionType: "webrtc";
	dynamicVariables: Record<string, string | number | boolean>;
	overrides?: { agent: { firstMessage: string } };
}

interface TeacherConnectionAdapters {
	getUserMedia?: () => Promise<StoppableMediaStream>;
	fetchAccess?: () => Promise<Response>;
}

export interface TeacherConnectionIssue {
	title: string;
	detail: string;
}

export type TeacherVoiceStartResult =
	| { started: true }
	| { started: false; issue: TeacherConnectionIssue };

const MICROPHONE_BLOCKED_ISSUE: TeacherConnectionIssue = {
	title: "Microphone access is blocked",
	detail:
		"Allow microphone access for this site in your browser, then tap Sarjy again.",
};

export function teacherConnectionIssueFromError(
	error: unknown,
): TeacherConnectionIssue {
	const message =
		typeof error === "string"
			? error
			: error instanceof Error
				? error.message
				: "";
	const name = error instanceof DOMException ? error.name : "";
	if (/quota (?:limit|exceeded)|exceeds your quota/i.test(message)) {
		return {
			title: "Voice credits are exhausted",
			detail:
				"ElevenLabs has no voice credits left. Add credits or enable overage, then tap Sarjy again.",
		};
	}
	if (
		name === "NotAllowedError" ||
		name === "PermissionDeniedError" ||
		name === "SecurityError" ||
		/permission denied|microphone.*(?:blocked|denied)/i.test(message)
	) {
		return MICROPHONE_BLOCKED_ISSUE;
	}

	return {
		title: "Voice connection dropped",
		detail:
			"The live voice connection ended unexpectedly. Tap Sarjy to reconnect.",
	};
}

export async function startTeacherVoiceSession(
	context: TeacherVoiceContext,
	startSession: (options: TeacherVoiceSessionOptions) => void,
	adapters: TeacherConnectionAdapters = {},
): Promise<TeacherVoiceStartResult> {
	const getUserMedia =
		adapters.getUserMedia ??
		(() => navigator.mediaDevices.getUserMedia({ audio: true }));
	const fetchAccess =
		adapters.fetchAccess ?? (() => fetch("/api/teacher/token"));

	let stream: StoppableMediaStream;
	try {
		stream = await getUserMedia();
	} catch (error) {
		const issue = teacherConnectionIssueFromError(error);
		if (issue.title === MICROPHONE_BLOCKED_ISSUE.title) {
			return {
				started: false,
				issue,
			};
		}
		throw error;
	}
	for (const track of stream.getTracks()) track.stop();

	let response: Response;
	try {
		response = await fetchAccess();
	} catch {
		return {
			started: false,
			issue: {
				title: "Sarjy couldn't connect",
				detail: "Check your connection, then tap Sarjy to retry.",
			},
		};
	}
	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as {
			error?: string;
		} | null;
		return {
			started: false,
			issue: {
				title: "Sarjy couldn't connect",
				detail:
					body?.error ?? "The teacher service is unavailable. Tap to retry.",
			},
		};
	}
	const access = (await response.json()) as TeacherAccess;

	const studentName = access.studentName.trim() || "there";
	startSession({
		conversationToken: access.token,
		connectionType: "webrtc",
		...(context.currentView === "Starting-point interview"
			? {
					overrides: {
						agent: {
							firstMessage: `Hi ${studentName}! Before I choose your first three questions, how have you used SQL before—if at all?`,
						},
					},
				}
			: {}),
		dynamicVariables: {
			student_name: studentName,
			user_id: access.userId,
			schema_summary: context.schemaSummary,
			current_view: context.currentView,
			lesson_title: context.lessonTitle,
			lesson_concept: context.lessonConcept,
			exercise_id: context.exerciseId,
			exercise_title: context.exerciseTitle,
			exercise_prompt: context.exercisePrompt,
			learner_brief: access.learnerBrief,
		},
	});

	return { started: true };
}

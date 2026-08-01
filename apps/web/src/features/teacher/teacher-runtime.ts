import { createStore } from "zustand/vanilla";

import { createTeacherControllerRegistry } from "./controller-registry";
import { createTeacherActivityGate } from "./teacher-activity-gate";
import { createTeacherRuntimeActions } from "./teacher-runtime-actions";
import type {
	TeacherRuntime,
	TeacherVoiceAdapter,
} from "./teacher-runtime-contract";
import { createTeacherRuntimeSession } from "./teacher-runtime-session";
import type { TeacherRuntimeState } from "./teacher-types";

export type {
	TeacherRuntime,
	TeacherVoiceAdapter,
} from "./teacher-runtime-contract";

const INITIAL_STATE: TeacherRuntimeState = {
	status: "disconnected",
	isSpeaking: false,
	userTalking: false,
	isMuted: false,
	connectionIssue: null,
	transcript: [],
	hint: null,
	evidenceRevision: 0,
};

export function createTeacherRuntime(): TeacherRuntime {
	const store = createStore<TeacherRuntimeState>(() => INITIAL_STATE);
	const controllers = createTeacherControllerRegistry();
	const session = createTeacherRuntimeSession();
	const activityGate = createTeacherActivityGate(() => {
		if (store.getState().status === "connected") {
			session.voice?.sendUserActivity();
		}
	});
	const actions = createTeacherRuntimeActions({
		store,
		controllers,
		session,
		activityGate,
	});

	return {
		store,
		actions,
		controllers,
		attachVoice: (adapter: TeacherVoiceAdapter | null) => {
			session.voice = adapter;
			if (!adapter) {
				activityGate.cancel();
				store.setState({
					status: "disconnected",
					isSpeaking: false,
					userTalking: false,
					isMuted: false,
				});
			}
		},
		syncVoiceState: (state) => store.setState(state),
		setConversationId: (id) => {
			session.conversationId = id;
		},
		getConversationId: () => session.conversationId,
		getScreenContext: () => session.screenContext,
		getCurrentExercise: () => session.exercise,
		getLearnerTurn: () => session.hintPolicy.getLearnerTurn(),
		recordHintEvent: (event, exerciseId) =>
			session.hintPolicy.record(event, exerciseId),
		resetSentScreenContext: () => {
			session.sentScreenContextKey = null;
		},
		setConnectionIssue: (issue) => store.setState({ connectionIssue: issue }),
		setUserTalking: (talking) => {
			if (store.getState().userTalking !== talking) {
				store.setState({ userTalking: talking });
			}
		},
		appendTranscript: (role, text) => {
			if (role === "user") session.hintPolicy.noteLearnerTurn();
			store.setState((state) => ({
				transcript: [
					...state.transcript,
					{ id: session.transcriptEntryId++, role, text },
				],
			}));
		},
		showHint: ({ exerciseId, ...hint }) => {
			const blocked = session.hintPolicy.blockReason({ exerciseId, ...hint });
			if (blocked) return blocked;
			store.setState({ hint: { id: session.hintId++, ...hint } });
			return "displayed";
		},
		bumpEvidenceRevision: () => {
			store.setState((state) => ({
				evidenceRevision: state.evidenceRevision + 1,
			}));
		},
		getSnapshot: () => ({ ...store.getState(), ...actions }),
	};
}

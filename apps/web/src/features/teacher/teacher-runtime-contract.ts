import type { StoreApi } from "zustand/vanilla";

import type { ExerciseWithLesson } from "@/lib/curriculum/types";
import type { TeacherScreenContext } from "@/lib/teacher/screen-context";
import type { TeacherVoiceSessionOptions } from "@/lib/teacher/teacher-connection";

import type { TeacherControllerRegistry } from "./controller-registry";
import type { TeacherHintEvent } from "./teacher-hint-policy";
import type {
	HintLevel,
	TeacherContextValue,
	TeacherRuntimeActions,
	TeacherRuntimeState,
	TeacherStatus,
	TranscriptEntry,
} from "./teacher-types";

export interface TeacherVoiceAdapter {
	startSession: (options: TeacherVoiceSessionOptions) => unknown;
	endSession: () => unknown;
	sendUserMessage: (text: string) => void;
	sendContextualUpdate: (update: string) => void;
	sendUserActivity: () => void;
	setMuted: (muted: boolean) => void;
	getInputVolume: () => number;
	getOutputVolume: () => number;
}

export interface TeacherRuntime {
	store: StoreApi<TeacherRuntimeState>;
	actions: TeacherRuntimeActions;
	controllers: TeacherControllerRegistry;
	attachVoice: (adapter: TeacherVoiceAdapter | null) => void;
	syncVoiceState: (state: {
		status: TeacherStatus;
		isSpeaking: boolean;
		isMuted: boolean;
	}) => void;
	setConversationId: (id: string | null) => void;
	getConversationId: () => string | null;
	getScreenContext: () => TeacherScreenContext | null;
	getCurrentExercise: () => ExerciseWithLesson | null;
	getLearnerTurn: () => number;
	recordHintEvent: (event: TeacherHintEvent, exerciseId: string) => string;
	resetSentScreenContext: () => void;
	setConnectionIssue: (issue: TeacherRuntimeState["connectionIssue"]) => void;
	setUserTalking: (talking: boolean) => void;
	appendTranscript: (role: TranscriptEntry["role"], text: string) => void;
	showHint: (hint: {
		exerciseId: string;
		level: HintLevel;
		title: string;
		body: string;
		sql?: string;
	}) => string;
	bumpEvidenceRevision: () => void;
	getSnapshot: () => TeacherContextValue;
}

import type { ExerciseWithLesson } from "@/lib/curriculum/types";
import type { TeacherScreenContext } from "@/lib/teacher/screen-context";

import {
	createTeacherHintPolicy,
	type TeacherHintPolicy,
} from "./teacher-hint-policy";
import type { TeacherVoiceAdapter } from "./teacher-runtime-contract";

export interface TeacherRuntimeSession {
	voice: TeacherVoiceAdapter | null;
	exercise: ExerciseWithLesson | null;
	screenContext: TeacherScreenContext | null;
	sentScreenContextKey: string | null;
	conversationId: string | null;
	hintPolicy: TeacherHintPolicy;
	transcriptEntryId: number;
	hintId: number;
}

export function createTeacherRuntimeSession(): TeacherRuntimeSession {
	return {
		voice: null,
		exercise: null,
		screenContext: null,
		sentScreenContextKey: null,
		conversationId: null,
		hintPolicy: createTeacherHintPolicy(),
		transcriptEntryId: 0,
		hintId: 0,
	};
}

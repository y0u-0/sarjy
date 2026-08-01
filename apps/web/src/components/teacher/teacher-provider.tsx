import type { ReactNode } from "react";

import {
	TeacherRuntimeProvider,
	useTeacherSelector,
	useTeacherValue,
} from "@/features/teacher/teacher-runtime-provider";
import type { TeacherContextValue } from "@/features/teacher/teacher-types";

export type {
	HintLevel,
	TeacherHint,
	TeacherStatus,
	TranscriptEntry,
} from "@/features/teacher/teacher-types";
export type { TeacherScreenContext } from "@/lib/teacher/screen-context";

/**
 * Stable teacher runtime for the learn layout.
 *
 * The learner page remains under the same provider hierarchy during SSR,
 * hydration, and voice activation. ElevenLabs is mounted client-side as a
 * sibling, so activating voice cannot remount or reset the open lesson.
 */
export function TeacherProvider({ children }: { children: ReactNode }) {
	return <TeacherRuntimeProvider>{children}</TeacherRuntimeProvider>;
}

/** Compatibility interface for route callers. Prefer selectors in new code. */
export function useTeacher(): TeacherContextValue {
	return useTeacherValue();
}

export { useTeacherSelector };

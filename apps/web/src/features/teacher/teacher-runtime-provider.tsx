import {
	createContext,
	lazy,
	type ReactNode,
	Suspense,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useStore } from "zustand";
import { createTeacherRuntime, type TeacherRuntime } from "./teacher-runtime";
import type { TeacherContextValue } from "./teacher-types";

const LazyTeacherVoiceBridge = lazy(async () => {
	const module = await import("./teacher-voice-bridge");
	return { default: module.TeacherVoiceBridgeProvider };
});

const TeacherRuntimeContext = createContext<TeacherRuntime | null>(null);

export function TeacherRuntimeProvider({
	children,
	voiceBridge,
}: {
	children: ReactNode;
	/** Test seam. Production uses the lazy, client-only ElevenLabs bridge. */
	voiceBridge?: ReactNode;
}) {
	const runtimeRef = useRef<TeacherRuntime | null>(null);
	runtimeRef.current ??= createTeacherRuntime();
	const runtime = runtimeRef.current;
	const [clientReady, setClientReady] = useState(false);

	useEffect(() => setClientReady(true), []);

	return (
		<TeacherRuntimeContext.Provider value={runtime}>
			{children}
			{clientReady && (
				<Suspense fallback={null}>
					{voiceBridge === undefined ? (
						<LazyTeacherVoiceBridge runtime={runtime} />
					) : (
						voiceBridge
					)}
				</Suspense>
			)}
		</TeacherRuntimeContext.Provider>
	);
}

export function useTeacherRuntime(): TeacherRuntime {
	const runtime = useContext(TeacherRuntimeContext);
	if (!runtime) {
		throw new Error("useTeacher must be used inside TeacherProvider.");
	}
	return runtime;
}

export function useTeacherValue(): TeacherContextValue {
	const runtime = useTeacherRuntime();
	const state = useStore(runtime.store);
	return useMemo(
		() => ({ ...state, ...runtime.actions }),
		[state, runtime.actions],
	);
}

export function useTeacherSelector<Selection>(
	selector: (value: TeacherContextValue) => Selection,
): Selection {
	const runtime = useTeacherRuntime();
	return useStore(runtime.store, (state) =>
		selector({ ...state, ...runtime.actions }),
	);
}

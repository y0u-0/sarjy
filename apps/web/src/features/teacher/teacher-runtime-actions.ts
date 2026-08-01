import { toast } from "sonner";
import type { StoreApi } from "zustand/vanilla";

import { SCHEMA_SUMMARY } from "@/lib/curriculum/dataset";
import { contextualUpdateFor } from "@/lib/teacher/screen-context";
import {
	startTeacherVoiceSession,
	teacherConnectionIssueFromError,
} from "@/lib/teacher/teacher-connection";

import type { TeacherControllerRegistry } from "./controller-registry";
import type { TeacherActivityGate } from "./teacher-activity-gate";
import type { TeacherRuntimeSession } from "./teacher-runtime-session";
import type {
	TeacherRuntimeActions,
	TeacherRuntimeState,
} from "./teacher-types";

interface TeacherActionDependencies {
	store: StoreApi<TeacherRuntimeState>;
	controllers: TeacherControllerRegistry;
	session: TeacherRuntimeSession;
	activityGate: TeacherActivityGate;
}

export function createTeacherRuntimeActions({
	store,
	controllers,
	session,
	activityGate,
}: TeacherActionDependencies): TeacherRuntimeActions {
	return {
		start: async () => {
			if (!session.voice) return false;
			const screen = session.screenContext;
			const currentExercise =
				screen?.kind === "exercise" ? session.exercise : null;
			const currentView = screen?.title ?? "Your three adaptive questions";
			store.setState({ transcript: [], connectionIssue: null });
			try {
				const result = await startTeacherVoiceSession(
					{
						currentView,
						lessonTitle: currentExercise?.lesson.title ?? currentView,
						lessonConcept:
							currentExercise?.lesson.concept ??
							screen?.summary ??
							"Adaptive SQL learning",
						exerciseId:
							currentExercise?.exercise.id ?? screen?.kind ?? "assessment",
						exerciseTitle: currentExercise?.exercise.title ?? currentView,
						exercisePrompt:
							currentExercise?.exercise.prompt ??
							screen?.summary ??
							currentView,
						schemaSummary: SCHEMA_SUMMARY,
					},
					(options) => {
						void session.voice?.startSession(options);
					},
				);
				if (result.started) return true;
				store.setState({ connectionIssue: result.issue });
				toast.error(result.issue.detail);
				return false;
			} catch (error) {
				const issue = teacherConnectionIssueFromError(error);
				store.setState({ connectionIssue: issue });
				toast.error(issue.detail);
				return false;
			}
		},
		end: () => {
			void session.voice?.endSession();
		},
		toggleMute: () => {
			session.voice?.setMuted(!store.getState().isMuted);
		},
		ask: (text) => {
			if (store.getState().status !== "connected" || !session.voice) {
				toast.info("Start your teacher session first. Press Start teaching.");
				return;
			}
			session.voice.sendUserMessage(text);
			session.hintPolicy.noteLearnerTurn();
			store.setState((state) => ({
				transcript: [
					...state.transcript,
					{ id: session.transcriptEntryId++, role: "user", text },
				],
			}));
		},
		observe: (update) => {
			if (store.getState().status === "connected") {
				session.voice?.sendContextualUpdate(update);
			}
		},
		notifyActivity: () => {
			if (store.getState().status === "connected") activityGate.notify();
		},
		dismissHint: (action = "dismissed") => {
			store.setState({ hint: null });
			if (store.getState().status !== "connected") return;
			session.voice?.sendContextualUpdate(
				action === "accepted"
					? "The student accepted your editor suggestion with Tab. It is now in their editor."
					: "The student dismissed your hint without using it.",
			);
		},
		setCurrentExercise: (entry) => {
			const previous = session.exercise;
			const previousScreen = session.screenContext;
			session.exercise = entry;
			session.hintPolicy.activateExercise(entry.exercise.id);
			session.screenContext = {
				kind: "exercise",
				title: `Exercise: ${entry.exercise.title}`,
				summary: `${entry.lesson.title} (${entry.lesson.id}). ${entry.exercise.prompt}`,
			};
			if (
				previous?.exercise.id === entry.exercise.id &&
				previousScreen?.kind === "exercise"
			) {
				return;
			}
			store.setState({ hint: null });
			if (store.getState().status === "connected") {
				session.voice?.sendContextualUpdate(
					`The student navigated to a new exercise. Exercise id: "${entry.exercise.id}". Lesson: "${entry.lesson.title}" (${entry.lesson.concept}). Exercise: "${entry.exercise.title}": ${entry.exercise.prompt}`,
				);
			}
		},
		setScreenContext: (context) => {
			session.screenContext = context;
			if (!context) {
				session.sentScreenContextKey = null;
				return;
			}
			if (store.getState().status !== "connected") return;
			const next = contextualUpdateFor(session.sentScreenContextKey, context);
			session.sentScreenContextKey = next.key;
			if (next.update) session.voice?.sendContextualUpdate(next.update);
		},
		registerLab: controllers.setLab,
		registerQuestion: controllers.setQuestion,
		registerStartingPoint: controllers.setStartingPoint,
		registerWalk: controllers.setWalk,
		registerProfile: controllers.setProfile,
		registerWeather: controllers.setWeather,
		getInputVolume: () => readVolume(session, "input"),
		getOutputVolume: () => readVolume(session, "output"),
	};
}

function readVolume(
	session: TeacherRuntimeSession,
	kind: "input" | "output",
): number {
	try {
		return kind === "input"
			? (session.voice?.getInputVolume() ?? 0)
			: (session.voice?.getOutputVolume() ?? 0);
	} catch {
		return 0;
	}
}

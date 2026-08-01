import type { ExerciseWithLesson } from "@/lib/curriculum/types";
import type { WeatherController } from "@/lib/live-data/weather-controller";
import type { LabController } from "@/lib/optimize/lab-controller";
import type { WalkController } from "@/lib/optimize/walk-controller";
import type { QuestionController } from "@/lib/practice/question-controller";
import type { StartingPointController } from "@/lib/practice/starting-point-controller";
import type { ProfileController } from "@/lib/profile/profile-controller";
import type { TeacherScreenContext } from "@/lib/teacher/screen-context";
import type { TeacherConnectionIssue } from "@/lib/teacher/teacher-connection";

export interface TranscriptEntry {
	id: number;
	role: "user" | "agent";
	text: string;
}

export type TeacherStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "disconnecting"
	| "error";

export type HintLevel = "nudge" | "hint" | "solution";

export interface TeacherHint {
	id: number;
	level: HintLevel;
	title: string;
	body: string;
	sql?: string;
}

export interface TeacherRuntimeState {
	status: TeacherStatus;
	isSpeaking: boolean;
	userTalking: boolean;
	isMuted: boolean;
	connectionIssue: TeacherConnectionIssue | null;
	transcript: TranscriptEntry[];
	hint: TeacherHint | null;
	evidenceRevision: number;
}

export interface TeacherRuntimeActions {
	dismissHint: (action?: "accepted" | "dismissed") => void;
	start: () => Promise<boolean>;
	end: () => void;
	toggleMute: () => void;
	ask: (text: string) => void;
	observe: (update: string) => void;
	notifyActivity: () => void;
	setCurrentExercise: (entry: ExerciseWithLesson) => void;
	setScreenContext: (context: TeacherScreenContext | null) => void;
	registerLab: (controller: LabController | null) => void;
	registerQuestion: (controller: QuestionController | null) => void;
	registerStartingPoint: (controller: StartingPointController | null) => void;
	registerWalk: (controller: WalkController | null) => void;
	registerProfile: (controller: ProfileController | null) => void;
	registerWeather: (controller: WeatherController | null) => void;
	getInputVolume: () => number;
	getOutputVolume: () => number;
}

export type TeacherContextValue = TeacherRuntimeState & TeacherRuntimeActions;

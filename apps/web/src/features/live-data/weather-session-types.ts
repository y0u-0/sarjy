import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";

import type { WeatherSurface } from "@/lib/live-data/weather-controller";
import type {
	WeatherLessonAction,
	WeatherLessonState,
	WeatherLessonTransition,
} from "@/lib/live-data/weather-lesson";

export type WeatherBusy = "mission" | "query" | null;
export type WeatherTransition = (
	action: WeatherLessonAction,
) => WeatherLessonTransition;
export type WeatherReveal = (
	surface: WeatherSurface,
	note: string | null,
) => void;

export interface WeatherSessionRefs {
	mission: { current: WeatherMission | null };
	lesson: { current: WeatherLessonState };
	query: { current: string };
	requestRevision: { current: number };
	attemptStartedAt: { current: number };
}

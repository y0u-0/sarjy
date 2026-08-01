import {
	isWeatherBlocked,
	WEATHER_NOT_OPEN,
} from "@/lib/live-data/weather-controller";
import { controlWeatherSurface } from "@/lib/teacher/teacher-surface-control";

import type { TeacherClientApi } from "./teacher-client-api";
import type { TeacherRuntime } from "./teacher-runtime";

export function createTeacherWeatherTools(
	runtime: TeacherRuntime,
	api: TeacherClientApi,
) {
	const { controllers } = runtime;
	return {
		weather_create_mission: (params: Record<string, unknown>) =>
			controllers
				.getWeather()
				?.createMission(
					Array.isArray(params.cities)
						? params.cities.map((city) => String(city))
						: [],
					String(params.focus ?? ""),
					Number(params.days ?? 7),
				) ?? WEATHER_NOT_OPEN,
		weather_record_prediction: (params: Record<string, unknown>) =>
			controllers
				.getWeather()
				?.recordPrediction(String(params.response ?? "")) ?? WEATHER_NOT_OPEN,
		weather_surface: (params: Record<string, unknown>) => {
			const weather = controllers.getWeather();
			return weather
				? controlWeatherSurface(weather, params)
				: WEATHER_NOT_OPEN;
		},
		weather_check_query: async () =>
			(await controllers.getWeather()?.checkQuery()) ?? WEATHER_NOT_OPEN,
		weather_record_explanation: async (params: Record<string, unknown>) => {
			const result =
				controllers
					.getWeather()
					?.recordExplanation(
						params.correct === true,
						String(params.rationale ?? ""),
					) ?? WEATHER_NOT_OPEN;
			if (isWeatherBlocked(result)) return result;

			const conversationId = runtime.getConversationId();
			const screen = runtime.getScreenContext();
			if (!conversationId || screen?.kind !== "live-data" || !screen.concept) {
				return result;
			}
			try {
				await api.practice.recordSignal({
					conversationId,
					kind:
						params.correct === true
							? "explained-correctly"
							: "explained-incorrectly",
					concept: screen.concept,
					rationale: String(params.rationale ?? "") || null,
				});
				runtime.bumpEvidenceRevision();
			} catch (error) {
				console.warn("[live-data] could not record teach-back", error);
			}
			return result;
		},
	};
}

import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../index";
import {
	createWeatherMission,
	WEATHER_MISSION_FOCUS,
	WeatherMissionError,
} from "../lib/weather-mission";

const weatherMissionInput = z.object({
	cities: z.array(z.string().min(2).max(80)).min(1).max(3),
	days: z.number().int().min(7).max(30),
	focus: z.enum(WEATHER_MISSION_FOCUS),
});

export const weatherRouter = {
	createMission: protectedProcedure
		.input(weatherMissionInput)
		.handler(async ({ input }) => {
			try {
				return await createWeatherMission(input);
			} catch (error) {
				if (error instanceof WeatherMissionError) {
					const code =
						error.kind === "invalid-input" ||
						error.kind === "location-not-found"
							? "BAD_REQUEST"
							: "SERVICE_UNAVAILABLE";
					throw new ORPCError(code, { message: error.message });
				}
				console.error("[weather-mission] unexpected failure", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "The live-data mission could not be created.",
				});
			}
		}),
};

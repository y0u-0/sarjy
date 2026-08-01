export const WEATHER_NOT_OPEN = "The live-data mission is not open.";
export const WEATHER_BLOCKED_PREFIX = "BLOCKED:";

export function isWeatherBlocked(message: string): boolean {
	return message.startsWith(WEATHER_BLOCKED_PREFIX);
}

export const WEATHER_SURFACES = [
	"question",
	"data",
	"chart",
	"result",
	"plan",
] as const;

export type WeatherSurface = (typeof WEATHER_SURFACES)[number];

export function isWeatherSurface(value: string): value is WeatherSurface {
	return WEATHER_SURFACES.some((surface) => surface === value);
}

export interface WeatherController {
	/** Calls the external source and freezes one bounded mission snapshot. */
	createMission(cities: string[], focus: string, days: number): Promise<string>;
	/** Records the learner's spoken prediction and unlocks the editor. */
	recordPrediction(response: string): string;
	/** Describes the mission and current agent-controlled canvas. */
	describe(): string;
	/** Reveals exactly one evidence surface when its teaching gate permits it. */
	setSurface(surface: string, note: string): string;
	/** Grades the exact SQL currently present in the learner's editor. */
	checkQuery(): Promise<string>;
	/** Records the learner's final explanation after result and chart review. */
	recordExplanation(correct: boolean, rationale: string): string;
}

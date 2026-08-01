import type { WeatherController } from "@/lib/live-data/weather-controller";
import type { LabController } from "@/lib/optimize/lab-controller";
import type { WalkController } from "@/lib/optimize/walk-controller";
import type { QuestionController } from "@/lib/practice/question-controller";
import type { StartingPointController } from "@/lib/practice/starting-point-controller";
import type { ProfileController } from "@/lib/profile/profile-controller";

export interface TeacherControllerRegistry {
	getLab: () => LabController | null;
	setLab: (controller: LabController | null) => void;
	getQuestion: () => QuestionController | null;
	setQuestion: (controller: QuestionController | null) => void;
	getStartingPoint: () => StartingPointController | null;
	setStartingPoint: (controller: StartingPointController | null) => void;
	getWalk: () => WalkController | null;
	setWalk: (controller: WalkController | null) => void;
	getProfile: () => ProfileController | null;
	setProfile: (controller: ProfileController | null) => void;
	getWeather: () => WeatherController | null;
	setWeather: (controller: WeatherController | null) => void;
	pauseActivePlayback: () => void;
}

export function createTeacherControllerRegistry(): TeacherControllerRegistry {
	let lab: LabController | null = null;
	let question: QuestionController | null = null;
	let startingPoint: StartingPointController | null = null;
	let walk: WalkController | null = null;
	let profile: ProfileController | null = null;
	let weather: WeatherController | null = null;

	return {
		getLab: () => lab,
		setLab: (controller) => {
			lab = controller;
		},
		getQuestion: () => question,
		setQuestion: (controller) => {
			question = controller;
		},
		getStartingPoint: () => startingPoint,
		setStartingPoint: (controller) => {
			startingPoint = controller;
		},
		getWalk: () => walk,
		setWalk: (controller) => {
			walk = controller;
		},
		getProfile: () => profile,
		setProfile: (controller) => {
			profile = controller;
		},
		getWeather: () => weather,
		setWeather: (controller) => {
			weather = controller;
		},
		pauseActivePlayback: () => {
			lab?.timelinePause();
			walk?.pause();
		},
	};
}

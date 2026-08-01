import type { WeatherController } from "@/lib/live-data/weather-controller";
import type { LabController } from "@/lib/optimize/lab-controller";
import type { WalkController } from "@/lib/optimize/walk-controller";
import type { ProfileController } from "@/lib/profile/profile-controller";

export type TeacherToolParameters = Record<string, unknown>;

function actionFrom(parameters: TeacherToolParameters): string {
	return String(parameters.action ?? "");
}

export function controlProfile(
	controller: ProfileController,
	parameters: TeacherToolParameters,
): string {
	switch (actionFrom(parameters)) {
		case "describe":
			return controller.describe();
		case "set-view":
			return controller.setView(String(parameters.view ?? ""));
		case "compare-session":
			return controller.compareSession(String(parameters.session_id ?? ""));
		case "focus-topic":
			return controller.focusTopic(
				String(parameters.concept ?? ""),
				String(parameters.note ?? ""),
			);
		default:
			return "Unsupported profile action. Use describe, set-view, compare-session, or focus-topic.";
	}
}

export function controlWeatherSurface(
	controller: WeatherController,
	parameters: TeacherToolParameters,
): string {
	switch (actionFrom(parameters)) {
		case "describe":
			return controller.describe();
		case "show":
			return controller.setSurface(
				String(parameters.surface ?? ""),
				String(parameters.note ?? ""),
			);
		default:
			return "Unsupported live-data surface action. Use describe or show.";
	}
}

export function controlLabCanvas(
	controller: LabController,
	parameters: TeacherToolParameters,
): string {
	switch (actionFrom(parameters)) {
		case "describe":
			return controller.describeSurface();
		case "show":
			return controller.setSurface(
				String(parameters.surface ?? ""),
				String(parameters.note ?? ""),
			);
		case "focus-plan":
			return controller.focusPlanNode(
				Number(parameters.node_id ?? 0),
				String(parameters.note ?? ""),
			);
		case "replay-animation":
			return controller.replayAnimation();
		default:
			return "Unsupported optimization canvas action. Use describe, show, focus-plan, or replay-animation.";
	}
}

export function controlLabTimeline(
	controller: LabController,
	parameters: TeacherToolParameters,
): string {
	switch (actionFrom(parameters)) {
		case "describe":
			return controller.timelineDescribe();
		case "step-to":
			return controller.timelineStepTo(Number(parameters.step ?? 0));
		case "next":
			return controller.timelineNext();
		case "previous":
			return controller.timelinePrevious();
		case "play":
			return controller.timelinePlay();
		case "pause":
			return controller.timelinePause();
		case "restart":
			return controller.timelineRestart();
		case "set-speed":
			return controller.timelineSetSpeed(Number(parameters.speed ?? 1));
		default:
			return "Unsupported optimization timeline action. Use describe, step-to, next, previous, play, pause, restart, or set-speed.";
	}
}

export function controlRowWalk(
	controller: WalkController,
	parameters: TeacherToolParameters,
): string {
	switch (actionFrom(parameters)) {
		case "describe":
			return controller.describe();
		case "step-to":
			return controller.stepTo(Number(parameters.row ?? 1));
		case "next":
			return controller.next();
		case "previous":
			return controller.previous();
		case "play":
			return controller.play();
		case "pause":
			return controller.pause();
		case "restart":
			return controller.restart();
		default:
			return "Unsupported row-walk action. Use describe, step-to, next, previous, play, pause, or restart.";
	}
}

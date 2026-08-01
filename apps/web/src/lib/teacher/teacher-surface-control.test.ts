import { describe, expect, test } from "bun:test";

import type { WeatherController } from "@/lib/live-data/weather-controller";
import type { LabController } from "@/lib/optimize/lab-controller";
import type { WalkController } from "@/lib/optimize/walk-controller";
import type { ProfileController } from "@/lib/profile/profile-controller";
import {
	controlLabCanvas,
	controlLabTimeline,
	controlProfile,
	controlRowWalk,
	controlWeatherSurface,
} from "@/lib/teacher/teacher-surface-control";

function spyResult(label: string, calls: string[]) {
	return (...args: unknown[]) => {
		calls.push(`${label}:${args.join(",")}`);
		return label;
	};
}

describe("teacher surface controls", () => {
	test("routes every profile action through one tool", () => {
		const calls: string[] = [];
		const controller: ProfileController = {
			describe: spyResult("describe", calls),
			setView: spyResult("set-view", calls),
			compareSession: spyResult("compare-session", calls),
			focusTopic: spyResult("focus-topic", calls),
		};

		expect(controlProfile(controller, { action: "describe" })).toBe("describe");
		expect(
			controlProfile(controller, { action: "set-view", view: "optimization" }),
		).toBe("set-view");
		expect(
			controlProfile(controller, {
				action: "compare-session",
				session_id: "previous",
			}),
		).toBe("compare-session");
		expect(
			controlProfile(controller, {
				action: "focus-topic",
				concept: "joins",
				note: "Compare this spoke.",
			}),
		).toBe("focus-topic");
		expect(calls).toEqual([
			"describe:",
			"set-view:optimization",
			"compare-session:previous",
			"focus-topic:joins,Compare this spoke.",
		]);
	});

	test("routes canvas and timeline actions without ambiguous fallbacks", () => {
		const calls: string[] = [];
		const controller = {
			describeSurface: spyResult("describe", calls),
			setSurface: spyResult("show", calls),
			focusPlanNode: spyResult("focus-plan", calls),
			replayAnimation: spyResult("replay", calls),
			timelineDescribe: spyResult("timeline-describe", calls),
			timelineStepTo: spyResult("step-to", calls),
			timelineNext: spyResult("next", calls),
			timelinePrevious: spyResult("previous", calls),
			timelinePlay: spyResult("play", calls),
			timelinePause: spyResult("pause", calls),
			timelineRestart: spyResult("restart", calls),
			timelineSetSpeed: spyResult("set-speed", calls),
		} as unknown as LabController;

		expect(
			controlLabCanvas(controller, {
				action: "show",
				surface: "plan",
				note: "Watch the scan.",
			}),
		).toBe("show");
		expect(
			controlLabCanvas(controller, {
				action: "focus-plan",
				node_id: 2,
				note: "This is the expensive step.",
			}),
		).toBe("focus-plan");
		expect(controlLabTimeline(controller, { action: "step-to", step: 3 })).toBe(
			"step-to",
		);
		expect(
			controlLabTimeline(controller, { action: "set-speed", speed: 0.75 }),
		).toBe("set-speed");
		expect(calls).toEqual([
			"show:plan,Watch the scan.",
			"focus-plan:2,This is the expensive step.",
			"step-to:3",
			"set-speed:0.75",
		]);
	});

	test("routes live-data and row-walk controls", () => {
		const calls: string[] = [];
		const weather = {
			describe: spyResult("weather-describe", calls),
			setSurface: spyResult("weather-show", calls),
		} as unknown as WeatherController;
		const walk = {
			describe: spyResult("walk-describe", calls),
			stepTo: spyResult("walk-step", calls),
			next: spyResult("walk-next", calls),
			previous: spyResult("walk-previous", calls),
			play: spyResult("walk-play", calls),
			pause: spyResult("walk-pause", calls),
			restart: spyResult("walk-restart", calls),
		} satisfies WalkController;

		expect(
			controlWeatherSurface(weather, {
				action: "show",
				surface: "chart",
				note: "Compare the cities.",
			}),
		).toBe("weather-show");
		expect(controlRowWalk(walk, { action: "step-to", row: 4 })).toBe(
			"walk-step",
		);
		expect(controlRowWalk(walk, { action: "play" })).toBe("walk-play");
		expect(calls).toEqual([
			"weather-show:chart,Compare the cities.",
			"walk-step:4",
			"walk-play:",
		]);
	});

	test("rejects unknown actions instead of silently choosing one", () => {
		const controller = {} as ProfileController;
		expect(controlProfile(controller, { action: "surprise" })).toContain(
			"Unsupported profile action",
		);
	});
});

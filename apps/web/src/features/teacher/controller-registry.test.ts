import { expect, test } from "bun:test";

import type { WalkController } from "@/lib/optimize/walk-controller";

import { createTeacherControllerRegistry } from "./controller-registry";

test("registers one active controller and clears it without stale playback", () => {
	const registry = createTeacherControllerRegistry();
	let paused = 0;
	const walk: WalkController = {
		stepTo: () => "stepped",
		next: () => "next",
		previous: () => "previous",
		play: () => "playing",
		pause: () => {
			paused += 1;
			return "paused";
		},
		restart: () => "restarted",
		describe: () => "walk",
	};

	registry.setWalk(walk);
	expect(registry.getWalk()).toBe(walk);
	registry.pauseActivePlayback();
	expect(paused).toBe(1);

	registry.setWalk(null);
	registry.pauseActivePlayback();
	expect(registry.getWalk()).toBeNull();
	expect(paused).toBe(1);
});

test("scopes starting-point completion to the mounted interview", async () => {
	const registry = createTeacherControllerRegistry();
	const controller = {
		complete: async (level: string) => `saved:${level}`,
	};

	expect(registry.getStartingPoint()).toBeNull();
	registry.setStartingPoint(controller);
	expect(
		await registry.getStartingPoint()?.complete("foundations", "reason"),
	).toBe("saved:foundations");
	registry.setStartingPoint(null);
	expect(registry.getStartingPoint()).toBeNull();
});

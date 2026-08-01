import { expect, test } from "bun:test";

import { shouldRunSarjyVolumeAnimation } from "./sarjy-orb-animation";

test("runs volume animation only for visible live audio states", () => {
	const visible = {
		documentVisible: true,
		intersecting: true,
		reducedMotion: false,
	};

	expect(shouldRunSarjyVolumeAnimation("listening", visible)).toBe(true);
	expect(shouldRunSarjyVolumeAnimation("talking", visible)).toBe(true);
	expect(shouldRunSarjyVolumeAnimation("thinking", visible)).toBe(false);
	expect(shouldRunSarjyVolumeAnimation(null, visible)).toBe(false);
	expect(
		shouldRunSarjyVolumeAnimation("listening", {
			...visible,
			intersecting: false,
		}),
	).toBe(false);
	expect(
		shouldRunSarjyVolumeAnimation("talking", {
			...visible,
			documentVisible: false,
		}),
	).toBe(false);
	expect(
		shouldRunSarjyVolumeAnimation("talking", {
			...visible,
			reducedMotion: true,
		}),
	).toBe(false);
});

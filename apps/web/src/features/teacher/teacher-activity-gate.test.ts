import { expect, test } from "bun:test";

import { createTeacherActivityGate } from "./teacher-activity-gate";

test("sends activity immediately, then coalesces a keystroke burst", () => {
	let now = 0;
	let sends = 0;
	let scheduled:
		| { callback: () => void; delay: number; handle: symbol }
		| undefined;
	const gate = createTeacherActivityGate(
		() => {
			sends += 1;
		},
		{
			now: () => now,
			schedule: (callback, delay) => {
				const handle = Symbol("activity");
				scheduled = { callback, delay, handle };
				return handle;
			},
			cancel: (handle) => {
				if (scheduled?.handle === handle) scheduled = undefined;
			},
		},
	);

	gate.notify();
	expect(sends).toBe(1);

	now = 100;
	gate.notify();
	now = 400;
	gate.notify();
	now = 700;
	gate.notify();
	expect(sends).toBe(1);
	expect(scheduled?.delay).toBe(900);

	now = 1_000;
	scheduled?.callback();
	expect(sends).toBe(2);
});

test("cancels a pending trailing activity when the voice bridge detaches", () => {
	let now = 0;
	let sends = 0;
	let scheduled: (() => void) | undefined;
	const gate = createTeacherActivityGate(
		() => {
			sends += 1;
		},
		{
			now: () => now,
			schedule: (callback) => {
				scheduled = callback;
				return 1;
			},
			cancel: () => {
				scheduled = undefined;
			},
		},
	);

	gate.notify();
	now = 10;
	gate.notify();
	gate.cancel();
	scheduled?.();

	expect(sends).toBe(1);
	gate.notify();
	expect(sends).toBe(2);
});

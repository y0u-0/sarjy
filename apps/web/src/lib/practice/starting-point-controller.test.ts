import { expect, test } from "bun:test";

import {
	concludeStartingPointInterview,
	nextStartingPointWrapUpPhase,
	startingPointCompletionBlocker,
} from "./starting-point-controller";

test("requires three learner answers before placement can finish", () => {
	expect(startingPointCompletionBlocker(0)).toContain("three answers");
	expect(startingPointCompletionBlocker(2)).toContain("one more question");
	expect(startingPointCompletionBlocker(3)).toBeNull();
});

test("waits for Sarjy to finish the wrap-up before revealing question one", () => {
	expect(nextStartingPointWrapUpPhase("waiting-for-silence", true)).toBe(
		"waiting-for-silence",
	);
	expect(nextStartingPointWrapUpPhase("waiting-for-silence", false)).toBe(
		"waiting-for-speech",
	);
	expect(nextStartingPointWrapUpPhase("waiting-for-speech", false)).toBe(
		"waiting-for-speech",
	);
	expect(nextStartingPointWrapUpPhase("waiting-for-speech", true)).toBe(
		"speaking",
	);
	expect(nextStartingPointWrapUpPhase("speaking", true)).toBe("speaking");
	expect(nextStartingPointWrapUpPhase("speaking", false)).toBe("ready");
});

test("publishes placement and opens the first assigned question", async () => {
	const events: string[] = [];
	const result = await concludeStartingPointInterview({
		complete: async () => ({
			created: true,
			questions: [
				{ exerciseId: "question-3", slot: 2 },
				{ exerciseId: "question-1", slot: 0 },
				{ exerciseId: "question-2", slot: 1 },
			],
		}),
		publish: () => events.push("published"),
		openQuestion: async (exerciseId) => {
			events.push(`opened:${exerciseId}`);
		},
	});

	expect(result.created).toBe(true);
	expect(events).toEqual(["published", "opened:question-1"]);
});

test("keeps the interview mounted when placement produces no questions", async () => {
	let published = false;
	let opened = false;

	await expect(
		concludeStartingPointInterview({
			complete: async () => ({ questions: [] }),
			publish: () => {
				published = true;
			},
			openQuestion: () => {
				opened = true;
			},
		}),
	).rejects.toThrow("did not produce an assigned question");
	expect(published).toBe(false);
	expect(opened).toBe(false);
});

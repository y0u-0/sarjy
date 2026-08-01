import { describe, expect, test } from "bun:test";

import { lessonPresentation } from "./lesson-presentation";
import {
	createOptimizationLesson,
	transitionOptimizationLesson,
} from "./lesson-session";

describe("optimization lesson presentation", () => {
	test("shows exactly the prompt for the response gate", () => {
		const initial = createOptimizationLesson("idx-country");
		expect(lessonPresentation(initial).title).toBe(
			"What does this SQL return?",
		);

		const interpreted = transitionOptimizationLesson(initial, {
			type: "record-interpretation",
			response: "It returns one filtered count.",
			correct: true,
			learnerTurn: 1,
		}).state;
		expect(lessonPresentation(interpreted).title).toBe(
			"How should we work through it?",
		);
	});

	test("makes authoring a visible learner checkpoint", () => {
		const authoring = {
			...createOptimizationLesson("idx-country"),
			checkpoint: "change" as const,
			awaitingResponse: "change" as const,
		};
		expect(lessonPresentation(authoring)).toMatchObject({
			eyebrow: "6 · Write",
			title: "Your turn to change the SQL",
			waiting: true,
		});
	});
});

import { describe, expect, test } from "bun:test";

import { createWeatherLesson, transitionWeatherLesson } from "./weather-lesson";

describe("agent-controlled live-data lesson", () => {
	test("enforces mission, prediction, query, evidence, and teach-back in order", () => {
		let lesson = createWeatherLesson();

		expect(
			transitionWeatherLesson(lesson, {
				type: "record-prediction",
				response: "Riyadh will be hotter",
			}).accepted,
		).toBe(false);

		for (const action of [
			{ type: "mission-created", missionId: "weather_1" },
			{ type: "record-prediction", response: "Riyadh will be hotter" },
			{ type: "query-checked", passed: true },
			{ type: "reveal-evidence", surface: "chart" },
			{ type: "record-explanation", correct: true },
		] as const) {
			const result = transitionWeatherLesson(lesson, action);
			expect(result.accepted).toBe(true);
			lesson = result.state;
		}

		expect(lesson.checkpoint).toBe("complete");
	});

	test("keeps the chart hidden until a query has been checked", () => {
		let lesson = transitionWeatherLesson(createWeatherLesson(), {
			type: "mission-created",
			missionId: "weather_1",
		}).state;
		lesson = transitionWeatherLesson(lesson, {
			type: "record-prediction",
			response: "Dubai will be hotter",
		}).state;

		const earlyChart = transitionWeatherLesson(lesson, {
			type: "reveal-evidence",
			surface: "chart",
		});
		expect(earlyChart.accepted).toBe(false);
		expect(earlyChart.message).toContain("checked query");
	});

	test("allows correction without treating a wrong query as completion", () => {
		let lesson = transitionWeatherLesson(createWeatherLesson(), {
			type: "mission-created",
			missionId: "weather_1",
		}).state;
		lesson = transitionWeatherLesson(lesson, {
			type: "record-prediction",
			response: "I expect almost no rain",
		}).state;
		lesson = transitionWeatherLesson(lesson, {
			type: "query-checked",
			passed: false,
		}).state;

		expect(lesson.checkpoint).toBe("query");
		expect(lesson.queryPassed).toBe(false);
		expect(
			transitionWeatherLesson(lesson, {
				type: "record-explanation",
				correct: true,
			}).accepted,
		).toBe(false);
	});
});

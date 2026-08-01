import { describe, expect, test } from "bun:test";
import { isLabSurface, surfaceForTimelineStep } from "./surface";
import type { OptimizationTimelineStep } from "./timeline";

function step(
	id: string,
	layer: OptimizationTimelineStep["layer"],
): OptimizationTimelineStep {
	return {
		id,
		layer,
		eyebrow: "Test",
		title: "Test",
		description: "Test",
		planNodeId: null,
		metric: null,
	};
}

describe("single optimization teaching canvas", () => {
	test("keeps query and change steps in the writing workspace", () => {
		expect(surfaceForTimelineStep(step("read-query", "query"))).toBe(
			"workspace",
		);
		expect(surfaceForTimelineStep(step("apply-change", "change"))).toBe(
			"workspace",
		);
	});

	test("opens only the teaching surface that matches the timeline step", () => {
		expect(surfaceForTimelineStep(step("baseline-plan", "plan"))).toBe("plan");
		expect(surfaceForTimelineStep(step("baseline-rows", "rows"))).toBe(
			"animation",
		);
		expect(surfaceForTimelineStep(step("predict", "change"))).toBe(
			"prediction",
		);
		expect(surfaceForTimelineStep(step("compare-work", "compare"))).toBe(
			"comparison",
		);
		expect(surfaceForTimelineStep(step("reflect", "reflect"))).toBe(
			"comparison",
		);
	});

	test("rejects unknown surface names from the agent", () => {
		expect(isLabSurface("plan")).toBe(true);
		expect(isLabSurface("everything")).toBe(false);
	});
});

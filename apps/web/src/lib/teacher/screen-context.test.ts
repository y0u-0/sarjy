import { describe, expect, test } from "bun:test";

import { contextualUpdateFor } from "./screen-context";

describe("teacher screen context", () => {
	test("emits one update for a screen and suppresses an identical repeat", () => {
		const context = {
			kind: "optimization" as const,
			title: "Optimization playground: Country lookup",
			summary: "Problem idx-country. Find purchases by country.",
			entityId: "idx-country",
			concept: "optimization-indexes",
		};

		const first = contextualUpdateFor(null, context);
		expect(first.update).toContain(context.title);

		const repeated = contextualUpdateFor(first.key, { ...context });
		expect(repeated.update).toBeNull();
		expect(repeated.key).toBe(first.key);
	});
});

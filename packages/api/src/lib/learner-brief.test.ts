import { describe, expect, test } from "bun:test";

import { preferredLearnerName } from "./learner-name";

describe("learner voice personalization", () => {
	test("uses the learner's saved preferred name before the account name", () => {
		expect(
			preferredLearnerName("Ada Lovelace", [
				{ key: "favorite color", value: "green" },
				{ key: "preferred name", value: "Captain" },
			]),
		).toBe("Captain");
	});
});

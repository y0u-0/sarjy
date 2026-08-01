import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { WeatherSubmitBar } from "./weather-submit-bar";

test("keeps submission visibly locked until the learner predicts", () => {
	const html = renderToStaticMarkup(
		<WeatherSubmitBar
			unlocked={false}
			accepted={false}
			checking={false}
			onSubmit={() => {}}
		/>,
	);

	expect(html).toContain("Submit answer");
	expect(html).toContain('disabled=""');
	expect(html).toContain("Make your prediction to unlock submission");
});

test("allows a correct query to be tested again without implying new evidence", () => {
	const html = renderToStaticMarkup(
		<WeatherSubmitBar unlocked accepted checking={false} onSubmit={() => {}} />,
	);

	expect(html).toContain("Test again");
	expect(html).not.toContain('disabled=""');
	expect(html).toContain(
		"Accepted once · later tests won’t change your profile",
	);
});

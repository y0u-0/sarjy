import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
	getAdaptationRelationship,
	InteractiveCaseStudy,
} from "./interactive-case-study";

test("student adapts state points from the learner to the system", () => {
	const html = renderToStaticMarkup(<InteractiveCaseStudy />);

	expect(html).toContain('aria-label="The learner adapts to the system"');
	expect(html).toContain("rotate-[-90deg]");
});

test("keeps the relationship source correct when the nodes trade places", () => {
	expect(getAdaptationRelationship(false)).toEqual({
		source: "learner",
		target: "system",
		rotationClass: "rotate-[-90deg]",
	});
	expect(getAdaptationRelationship(true)).toEqual({
		source: "system",
		target: "learner",
		rotationClass: "rotate-[-90deg]",
	});
});

test("presents the shortened eight-slide story", () => {
	const html = renderToStaticMarkup(<InteractiveCaseStudy />);

	expect(html).toContain('aria-label="Go to slide 8"');
	expect(html).not.toContain('aria-label="Go to slide 9"');
});

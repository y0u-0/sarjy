import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { optimizationProblemBank } from "@/lib/curriculum/optimization-bank";

import { OptimizationEditor } from "./optimization-editor";

test("keeps the writer completely out of the lesson until prediction", () => {
	const problem = optimizationProblemBank[0];
	if (!problem) throw new Error("Optimization fixture is missing.");
	const html = renderToStaticMarkup(
		<OptimizationEditor
			problem={problem}
			prediction={null}
			isAuthoring={false}
			indexSql=""
			onIndexSqlChange={() => {}}
			rewriteSql=""
			onRewriteSqlChange={() => {}}
			tables={[]}
			busy={false}
			activeIndexCount={0}
			onMeasure={() => {}}
		/>,
	);

	expect(html).toBe("");
});

test("removes the writer as soon as measurement begins", () => {
	const problem = optimizationProblemBank[0];
	if (!problem) throw new Error("Optimization fixture is missing.");
	const html = renderToStaticMarkup(
		<OptimizationEditor
			problem={problem}
			prediction={{ question: "What changes?", response: "Less scan work." }}
			isAuthoring={false}
			indexSql="CREATE INDEX idx_country ON plays(country)"
			onIndexSqlChange={() => {}}
			rewriteSql=""
			onRewriteSqlChange={() => {}}
			tables={[]}
			busy={false}
			activeIndexCount={1}
			onMeasure={() => {}}
		/>,
	);

	expect(html).toBe("");
});

test("shows the writer only for the learner's authoring checkpoint", () => {
	const problem = optimizationProblemBank[0];
	if (!problem) throw new Error("Optimization fixture is missing.");
	const html = renderToStaticMarkup(
		<OptimizationEditor
			problem={problem}
			prediction={{ question: "What changes?", response: "Less scan work." }}
			isAuthoring
			indexSql=""
			onIndexSqlChange={() => {}}
			rewriteSql=""
			onRewriteSqlChange={() => {}}
			tables={[]}
			busy={false}
			activeIndexCount={0}
			onMeasure={() => {}}
		/>,
	);

	expect(html).toContain("Write an index");
	expect(html).toContain("Ask Sarjy to measure");
});

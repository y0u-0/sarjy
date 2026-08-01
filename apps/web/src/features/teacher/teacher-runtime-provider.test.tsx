import { afterEach, expect, test } from "bun:test";
// @ts-expect-error jsdom does not publish declarations; this test uses its public JSDOM class.
import { JSDOM } from "jsdom";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { TeacherRuntimeProvider } from "./teacher-runtime-provider";

let root: Root | null = null;
let dom: JSDOM | null = null;
const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalNavigator = globalThis.navigator;
const originalActEnvironment = (
	globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT;

afterEach(async () => {
	if (root) {
		await act(async () => root?.unmount());
	}
	root = null;
	dom?.window.close();
	dom = null;
	Object.assign(globalThis, {
		IS_REACT_ACT_ENVIRONMENT: originalActEnvironment,
		window: originalWindow,
		document: originalDocument,
		navigator: originalNavigator,
	});
});

test("keeps learner content mounted once when the client voice bridge activates", async () => {
	dom = new JSDOM(
		"<!doctype html><html><body><div id='root'></div></body></html>",
		{
			url: "https://sarjy.test/learn",
		},
	);
	Object.assign(globalThis, {
		IS_REACT_ACT_ENVIRONMENT: true,
		window: dom.window,
		document: dom.window.document,
		navigator: dom.window.navigator,
	});

	let learnerMounts = 0;
	let learnerUnmounts = 0;
	let bridgeMounts = 0;

	function LearnerPage() {
		useEffect(() => {
			learnerMounts += 1;
			return () => {
				learnerUnmounts += 1;
			};
		}, []);
		return <p>learner workspace</p>;
	}

	function VoiceBridgeProbe() {
		useEffect(() => {
			bridgeMounts += 1;
		}, []);
		return null;
	}

	const container = dom.window.document.getElementById("root");
	if (!container) throw new Error("Test root was not created.");
	root = createRoot(container);

	await act(async () => {
		root?.render(
			<TeacherRuntimeProvider voiceBridge={<VoiceBridgeProbe />}>
				<LearnerPage />
			</TeacherRuntimeProvider>,
		);
		await Promise.resolve();
	});

	expect(learnerMounts).toBe(1);
	expect(learnerUnmounts).toBe(0);
	expect(bridgeMounts).toBe(1);
});

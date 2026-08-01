export interface TeacherScreenContext {
	kind: "assessment" | "exercise" | "optimization" | "profile" | "live-data";
	title: string;
	summary: string;
	/** Stable screen entity used by voice-tool audit events. */
	entityId?: string;
	/** Learner-model concept, when the screen is tied to one exact skill. */
	concept?: string;
}

function keyFor(context: TeacherScreenContext): string {
	return JSON.stringify([
		context.kind,
		context.title,
		context.summary,
		context.entityId ?? null,
		context.concept ?? null,
	]);
}

export function contextualUpdateFor(
	previousKey: string | null,
	context: TeacherScreenContext,
): { key: string; update: string | null } {
	const key = keyFor(context);
	return {
		key,
		update:
			key === previousKey
				? null
				: `The student is now viewing ${context.title}. ${context.summary}`,
	};
}

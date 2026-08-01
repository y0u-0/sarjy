import type { MisconceptionKind } from "@sarjy-sql/api/lib/practice-policy";

export interface ConceptProfileView {
	concept: string;
	current: number;
	opportunities: number;
	passes: number;
	trajectory: "stuck" | "converging" | "mixed" | "unknown";
	mistakes: { kind: MisconceptionKind; count: number }[];
	lastSeenAt: Date | string | null;
	everMastered: boolean;
	unassistedPasses: number;
	assistedPasses: number;
	explanation: "correct" | "incorrect" | null;
}

export function describeConceptState(
	current: number,
	everMastered: boolean,
	trajectory: ConceptProfileView["trajectory"],
): { label: string; tone: string; fill: string } {
	if (current >= 0.95) {
		return { label: "solid", tone: "bg-lime/15 text-lime", fill: "bg-lime" };
	}
	if (everMastered && current < 0.45) {
		return {
			label: "fading",
			tone: "bg-periwinkle/20 text-periwinkle",
			fill: "bg-periwinkle",
		};
	}
	if (trajectory === "stuck") {
		return {
			label: "one thing in the way",
			tone: "bg-tangerine/15 text-tangerine",
			fill: "bg-tangerine",
		};
	}
	if (current >= 0.6) {
		return {
			label: "nearly there",
			tone: "bg-cream/15 text-cream",
			fill: "bg-cream",
		};
	}
	return {
		label: "getting started",
		tone: "bg-foreground/10 text-muted-foreground",
		fill: "bg-muted-foreground",
	};
}

export function adviseOnConcept(profile: ConceptProfileView): string {
	const { current, trajectory, mistakes, everMastered, opportunities } =
		profile;
	if (profile.explanation === "incorrect") {
		return "Your result was right, but your explanation did not match the plan evidence yet. Ask Sarjy to replay the measured steps and teach it back once more.";
	}
	if (current >= 0.95 && profile.explanation !== "correct") {
		return "The queries are landing. One teach-back in your own words will verify that the idea transfers beyond this exact answer.";
	}
	if (opportunities < 4) {
		return "Too early to say much. A few more attempts and this gets useful.";
	}
	if (trajectory === "stuck" && mistakes[0]) {
		return `The same thing has caught you ${mistakes[0].count} times — ${describeMistake(mistakes[0].kind).toLowerCase()}. Another exercise probably won't shift it; ask Sarjy to take one apart with you.`;
	}
	if (current >= 0.95) {
		return "Nothing to do here. It'll fade if you leave it a few weeks, and this page will tell you when.";
	}
	if (everMastered && current < 0.45) {
		return "You had this. It's just gone quiet — one exercise is usually enough to bring it back.";
	}
	if (trajectory === "converging") {
		return "Your mistakes are moving, which is what learning looks like from the inside. Keep going.";
	}
	if (current >= 0.6) return "Close. One or two more and this is done.";
	return "Early days on this one. Work through it with Sarjy rather than alone — it'll be faster.";
}

export function describeMistake(kind: MisconceptionKind): string {
	switch (kind) {
		case "wrong-columns":
			return "Picking which columns to return";
		case "wrong-row-count":
			return "Narrowing to exactly the right rows";
		case "wrong-order":
			return "Sorting the result";
		case "wrong-values":
			return "Right shape, wrong values";
		case "different-result":
			return "The rewrite changed the answer";
		case "no-plan-improvement":
			return "The query plan stayed expensive";
		case "sql-error":
			return "Syntax slips";
	}
}

export function relativePracticeDate(when: Date | string): string {
	const then = typeof when === "string" ? new Date(when) : when;
	const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
	if (days <= 0) return "today";
	if (days === 1) return "yesterday";
	if (days < 14) return `${days} days ago`;
	return `${Math.floor(days / 7)} weeks ago`;
}

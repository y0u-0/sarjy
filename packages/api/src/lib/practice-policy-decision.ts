import type { MisconceptionKind } from "@sarjy-sql/db/schema/memory";

import { isMastered, MASTERY_SHAKY } from "./mastery";
import { classifyTrajectory } from "./practice-policy-signals";
import type { ConceptSignals, Recommendation } from "./practice-policy-types";

const CONSECUTIVE_FAILURE_BAILOUT = 5;
const MIN_OPPORTUNITIES = 4;
const SESSION_OPPORTUNITY_CAP = 10;
const OVERCONFIDENT_THRESHOLD = 2;

function describeKind(kind: MisconceptionKind): string {
	switch (kind) {
		case "wrong-columns":
			return "picking the columns";
		case "wrong-row-count":
			return "narrowing to the right rows";
		case "wrong-order":
			return "ordering the result";
		case "wrong-values":
			return "getting the values right";
		case "different-result":
			return "keeping the answer equivalent";
		case "no-plan-improvement":
			return "changing the engine's plan";
		case "sql-error":
			return "the syntax";
	}
}

function priorityDecision(signals: ConceptSignals): Recommendation | null {
	const { concept } = signals;
	const latestPreference = [...signals.spokenSignals]
		.reverse()
		.find(
			(kind) =>
				kind === "requested-more-practice" || kind === "requested-to-move-on",
		);
	if (latestPreference === "requested-more-practice") {
		return {
			action: "practise",
			concept,
			reason: "You asked for more of these, so here they are.",
			unlockCount: 2,
		};
	}
	if (latestPreference === "requested-to-move-on") {
		return {
			action: "advance",
			concept,
			reason: "You wanted to move on — this stays here if you want it later.",
			unlockCount: 0,
		};
	}
	if (signals.consecutiveFailures >= CONSECUTIVE_FAILURE_BAILOUT) {
		return {
			action: "consolidate",
			concept,
			reason:
				"This one is fighting you. Let's take it apart together before you try another.",
			unlockCount: 0,
		};
	}
	if (signals.opportunitiesThisSession >= SESSION_OPPORTUNITY_CAP) {
		return {
			action: "rest",
			concept,
			reason:
				"That's a solid run at this. It'll stick better if you come back to it.",
			unlockCount: 0,
		};
	}
	if (signals.opportunities < MIN_OPPORTUNITIES) {
		return {
			action: "hold",
			concept,
			reason: "Still getting a read on this one.",
			unlockCount: 0,
		};
	}
	if (
		signals.calibration.overconfident >= OVERCONFIDENT_THRESHOLD &&
		!isMastered(signals.mastery)
	) {
		return {
			action: "practise",
			concept,
			reason:
				"These have been catching you out when you expected them to work — worth a couple more to find the edge.",
			unlockCount: 2,
		};
	}
	if (signals.explanation === "incorrect") {
		return {
			action: "consolidate",
			concept,
			reason:
				"Your query ran, but the explanation still has a gap. Let's connect it to what the plan actually did.",
			unlockCount: 0,
		};
	}
	return null;
}

function masteredDecision(signals: ConceptSignals): Recommendation {
	if (signals.distinctPassedExercises < 2) {
		return {
			action: "practise",
			concept: signals.concept,
			reason:
				"That worked here. Try the same idea on a different shape before we call it durable.",
			unlockCount: 1,
		};
	}
	if (signals.unassistedPasses === 0) {
		return {
			action: "consolidate",
			concept: signals.concept,
			reason:
				"You solved these with help. Let's do one clean attempt from your own plan before moving on.",
			unlockCount: 0,
		};
	}
	if (signals.explanation !== "correct") {
		return {
			action: "consolidate",
			concept: signals.concept,
			reason:
				"The SQL works. Explain why it works in your own words, then this topic is ready to move on.",
			unlockCount: 0,
		};
	}
	return {
		action: "advance",
		concept: signals.concept,
		reason: "You've got this one. Moving on.",
		unlockCount: 0,
	};
}

export function decide(signals: ConceptSignals): Recommendation {
	const priority = priorityDecision(signals);
	if (priority) return priority;
	if (isMastered(signals.mastery)) return masteredDecision(signals);
	if (signals.everMastered && signals.mastery < MASTERY_SHAKY) {
		return {
			action: "review",
			concept: signals.concept,
			reason: "You had this a while back. One to knock the rust off.",
			unlockCount: 1,
		};
	}
	const trajectory = classifyTrajectory(signals.recentKinds);
	const stuckOn = signals.recentKinds[0];
	if (trajectory === "stuck" && stuckOn) {
		return {
			action: "consolidate",
			concept: signals.concept,
			reason: `Same thing tripping you each time — ${describeKind(stuckOn)}. Let me show you why.`,
			unlockCount: 0,
		};
	}
	if (
		signals.calibration.underconfident >= OVERCONFIDENT_THRESHOLD &&
		signals.calibration.overconfident === 0
	) {
		if (signals.distinctPassedExercises < 2) {
			return {
				action: "practise",
				concept: signals.concept,
				reason:
					"That answer was right. One different shape will show whether the idea transfers.",
				unlockCount: 1,
			};
		}
		if (signals.unassistedPasses === 0 || signals.explanation !== "correct") {
			return {
				action: "consolidate",
				concept: signals.concept,
				reason:
					"You got it right even while unsure. Explain why it works once, then trust it.",
				unlockCount: 0,
			};
		}
		return {
			action: "advance",
			concept: signals.concept,
			reason:
				"You keep saying you're unsure and then getting these right. Trust it — you're ready for the next thing.",
			unlockCount: 0,
		};
	}
	const said = new Set(signals.spokenSignals);
	if (said.has("reported-confusion") || said.has("asked-for-answer")) {
		return {
			action: "consolidate",
			concept: signals.concept,
			reason: "You said this one wasn't landing. Let's go back a step.",
			unlockCount: 0,
		};
	}
	return {
		action: "practise",
		concept: signals.concept,
		reason: "You're closing in on this. Want to lock it in?",
		unlockCount: 1,
	};
}

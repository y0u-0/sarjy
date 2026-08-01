import type { TeacherQualityEvent } from "@sarjy-sql/db/schema/practice";

export type { TeacherQualityEvent } from "@sarjy-sql/db/schema/practice";

export interface TeacherQualityEventInput {
	event: TeacherQualityEvent;
	problemId: string | null;
	detail?: string | null;
}

export interface TeacherQualityAudit {
	visualBeforeInterpretation: number;
	visualBeforeGuidance: number;
	predictionsWithoutObservation: number;
	changesWithoutPrediction: number;
	changesWithoutTeachback: number;
	teachbacksWithoutAlternativeReview: number;
	blockedActions: number;
	longAgentTurns: number;
	prematureSolutionReveals: number;
	completedCycles: number;
}

interface ProblemAuditState {
	interpretationRecorded: boolean;
	guidanceSelected: boolean;
	observationRecorded: boolean;
	predictionRecorded: boolean;
	predictionAsked: boolean;
	changeApplied: boolean;
	alternativesReviewed: boolean;
	teachbackCorrect: boolean;
}

function problemState(
	states: Map<string, ProblemAuditState>,
	problemId: string,
): ProblemAuditState {
	const existing = states.get(problemId);
	if (existing) return existing;
	const created: ProblemAuditState = {
		interpretationRecorded: false,
		guidanceSelected: false,
		observationRecorded: false,
		predictionRecorded: false,
		predictionAsked: false,
		changeApplied: false,
		alternativesReviewed: false,
		teachbackCorrect: false,
	};
	states.set(problemId, created);
	return created;
}

/**
 * Folds the append-only voice-tool trace into teacher behavior only. None of these
 * counters are learner evidence, so callers must never feed them into mastery.
 */
export function analyzeTeacherQuality(
	events: readonly TeacherQualityEventInput[],
): TeacherQualityAudit {
	const audit: TeacherQualityAudit = {
		visualBeforeInterpretation: 0,
		visualBeforeGuidance: 0,
		predictionsWithoutObservation: 0,
		changesWithoutPrediction: 0,
		changesWithoutTeachback: 0,
		teachbacksWithoutAlternativeReview: 0,
		blockedActions: 0,
		longAgentTurns: 0,
		prematureSolutionReveals: 0,
		completedCycles: 0,
	};
	const states = new Map<string, ProblemAuditState>();
	let sessionEnded = false;

	for (const entry of events) {
		if (entry.event === "session-ended") {
			sessionEnded = true;
			continue;
		}
		if (entry.event === "guard-blocked") audit.blockedActions += 1;
		if (
			entry.event === "agent-response" &&
			(entry.detail?.trim().split(/\s+/).filter(Boolean).length ?? 0) > 60
		) {
			audit.longAgentTurns += 1;
		}
		if (!entry.problemId) continue;
		const state = problemState(states, entry.problemId);
		if (
			entry.event === "agent-response" &&
			state.guidanceSelected &&
			!state.predictionAsked &&
			/\b(?:add|create|use|try|apply)(?:\s+an?|\s+the)?\s+(?:index|rewrite|subquery|cte|ctas)\b/i.test(
				entry.detail ?? "",
			)
		) {
			audit.prematureSolutionReveals += 1;
		}
		switch (entry.event) {
			case "interpretation-recorded":
				state.interpretationRecorded = true;
				break;
			case "guidance-selected":
				state.guidanceSelected = true;
				break;
			case "plan-revealed":
				if (!state.interpretationRecorded) {
					audit.visualBeforeInterpretation += 1;
				}
				if (!state.guidanceSelected) audit.visualBeforeGuidance += 1;
				break;
			case "observation-recorded":
				if (state.changeApplied) {
					state.predictionRecorded = false;
					state.changeApplied = false;
					state.alternativesReviewed = false;
					state.teachbackCorrect = false;
				}
				state.observationRecorded = true;
				break;
			case "prediction-asked":
				state.predictionAsked = true;
				if (!state.observationRecorded) {
					audit.predictionsWithoutObservation += 1;
				}
				break;
			case "prediction-recorded":
				state.predictionRecorded = true;
				break;
			case "change-applied":
				state.changeApplied = true;
				state.alternativesReviewed = false;
				if (!state.predictionRecorded) audit.changesWithoutPrediction += 1;
				break;
			case "alternatives-reviewed":
				state.alternativesReviewed = true;
				break;
			case "teachback-correct":
				if (!state.alternativesReviewed) {
					audit.teachbacksWithoutAlternativeReview += 1;
				}
				if (!state.teachbackCorrect) audit.completedCycles += 1;
				state.teachbackCorrect = true;
				break;
		}
	}

	if (sessionEnded) {
		for (const state of states.values()) {
			if (state.changeApplied && !state.teachbackCorrect) {
				audit.changesWithoutTeachback += 1;
			}
		}
	}

	return audit;
}

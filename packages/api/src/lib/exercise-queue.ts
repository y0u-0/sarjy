import type { SessionInsightKind } from "@sarjy-sql/db/schema/practice";

export const ASSESSMENT_QUEUE_SIZE = 3;
export const MAX_ACTIVE_PER_CONCEPT = 2;

export interface QueueCandidate {
	id: string;
	concept: string;
	/** Coarse authored/derived band: 0 easiest, 3 hardest. */
	difficulty: number;
}

export interface ActiveQueueCandidate extends QueueCandidate {
	slot: number;
}

export interface QueueConceptEvidence {
	concept: string;
	mastery: number;
	opportunities: number;
	consecutiveFailures: number;
	explanation: "correct" | "incorrect" | null;
	/** Structured facts extracted from the live or just-finished voice session. */
	spokenSignals: SessionInsightKind[];
}

export interface QueueSelection {
	candidate: QueueCandidate;
	reason: string;
}

interface SelectQueueCandidateInput {
	candidates: QueueCandidate[];
	assignedIds: ReadonlySet<string>;
	active: ActiveQueueCandidate[];
	evidence: QueueConceptEvidence[];
	skippedByConcept: ReadonlyMap<string, number>;
	recentlyResolvedIds?: ReadonlySet<string>;
	slot: number;
	/** Injected so selection is testable while production still samples naturally. */
	random?: () => number;
}

function targetDifficulty(
	evidence: QueueConceptEvidence | undefined,
	skips: number,
	slot: number,
): number {
	const said = new Set(evidence?.spokenSignals ?? []);
	if (
		said.has("reported-confusion") ||
		said.has("asked-for-answer") ||
		said.has("explained-incorrectly")
	) {
		return 0;
	}
	if (!evidence || evidence.opportunities === 0) return Math.min(slot, 2);
	if (skips > 0 || evidence.consecutiveFailures >= 2) return 0;
	if (evidence.mastery < 0.4) return 0;
	if (evidence.mastery < 0.7) return 1;
	if (evidence.mastery < 0.9) return 2;
	return 3;
}

function conceptPriority(
	evidence: QueueConceptEvidence | undefined,
	skips: number,
	activeCount: number,
): number {
	let score = 0;

	if (!evidence || evidence.opportunities === 0) {
		// The first three cards sample breadth. Once one concept is represented its
		// second card loses heavily to any still-untested concept.
		score += 5;
	} else {
		score += (1 - evidence.mastery) * 6;
		score += Math.min(evidence.consecutiveFailures, 4) * 1.5;
		if (evidence.explanation === "incorrect") score += 4;
		if (evidence.explanation === "correct" && evidence.mastery >= 0.75) {
			score -= 2;
		}
	}

	// Voice statements matter even before a graded submission. Preference signals
	// use latest-wins so one conversation cannot simultaneously mean "more" and
	// "move on" just because both phrases occurred at different times.
	const said = new Set(evidence?.spokenSignals ?? []);
	if (said.has("reported-confusion")) score += 6;
	if (said.has("asked-for-answer")) score += 4;
	if (said.has("explained-incorrectly")) score += 4;
	if (said.has("explained-correctly") && (evidence?.mastery ?? 0) >= 0.75) {
		score -= 2;
	}
	const latestPreference = [...(evidence?.spokenSignals ?? [])]
		.reverse()
		.find(
			(kind) =>
				kind === "requested-more-practice" || kind === "requested-to-move-on",
		);
	if (latestPreference === "requested-more-practice") score += 7;
	if (latestPreference === "requested-to-move-on") score -= 8;

	score += Math.min(skips, 3) * 5;
	score -= activeCount * 8;
	return score;
}

function selectionReason(
	evidence: QueueConceptEvidence | undefined,
	skips: number,
): string {
	if (skips > 0) return "A new shape from a topic you skipped";
	const said = new Set(evidence?.spokenSignals ?? []);
	if (
		said.has("reported-confusion") ||
		said.has("asked-for-answer") ||
		said.has("explained-incorrectly") ||
		evidence?.explanation === "incorrect"
	) {
		return "A gentler follow-up to something discussed with Sarjy";
	}
	if (!evidence || evidence.opportunities === 0) {
		return said.has("requested-more-practice")
			? "More practice you asked Sarjy for"
			: "A fresh topic to help estimate your level";
	}
	if (
		evidence.consecutiveFailures > 0 ||
		evidence.mastery < 0.7 ||
		said.has("requested-more-practice")
	) {
		return "More evidence from a topic that needs another look";
	}
	return "A transfer question to check durable understanding";
}

/**
 * Samples one replacement card without reshuffling cards already on screen.
 *
 * It works when the catalog contains at least one non-active candidate. After the
 * unseen catalog is exhausted it prefers cooled-down prompts; only an undersized
 * catalog may force immediate reuse. At most two live cards share a concept
 * whenever an alternative concept exists.
 */
export function selectQueueCandidate({
	candidates,
	assignedIds,
	active,
	evidence,
	skippedByConcept,
	recentlyResolvedIds = new Set(),
	slot,
	random = Math.random,
}: SelectQueueCandidateInput): QueueSelection | null {
	const evidenceByConcept = new Map(
		evidence.map((entry) => [entry.concept, entry] as const),
	);
	const activeIds = new Set(active.map((entry) => entry.id));
	const activeByConcept = new Map<string, number>();
	for (const entry of active) {
		activeByConcept.set(
			entry.concept,
			(activeByConcept.get(entry.concept) ?? 0) + 1,
		);
	}

	const unseen = candidates.filter(
		(candidate) =>
			!assignedIds.has(candidate.id) && !activeIds.has(candidate.id),
	);
	const inactive = candidates.filter(
		(candidate) => !activeIds.has(candidate.id),
	);
	const cooled = inactive.filter(
		(candidate) => !recentlyResolvedIds.has(candidate.id),
	);
	const eligible =
		unseen.length > 0 ? unseen : cooled.length > 0 ? cooled : inactive;
	if (eligible.length === 0) return null;

	const conceptsBelowCap = new Set(
		eligible
			.filter(
				(candidate) =>
					(activeByConcept.get(candidate.concept) ?? 0) <
					MAX_ACTIVE_PER_CONCEPT,
			)
			.map((candidate) => candidate.concept),
	);
	const capped =
		conceptsBelowCap.size > 0
			? eligible.filter((candidate) => conceptsBelowCap.has(candidate.concept))
			: eligible;

	const ranked = capped.map((candidate) => {
		const conceptEvidence = evidenceByConcept.get(candidate.concept);
		const skips = skippedByConcept.get(candidate.concept) ?? 0;
		const desired = targetDifficulty(conceptEvidence, skips, slot);
		const priority = conceptPriority(
			conceptEvidence,
			skips,
			activeByConcept.get(candidate.concept) ?? 0,
		);
		return {
			candidate,
			reason: selectionReason(conceptEvidence, skips),
			score:
				priority - Math.abs(candidate.difficulty - desired) * 1.25 + random(),
		};
	});

	ranked.sort((left, right) => right.score - left.score);
	const selected = ranked[0];
	return selected
		? { candidate: selected.candidate, reason: selected.reason }
		: null;
}

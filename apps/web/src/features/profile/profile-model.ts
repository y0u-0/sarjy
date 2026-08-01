import type { CalibrationTally } from "@sarjy-sql/api/lib/practice-policy";

import type { ConceptProfileView } from "@/components/practice/concept-card";
import { lessons } from "@/lib/curriculum";
import { optimizationConcepts } from "@/lib/curriculum/optimization-bank";

import type {
	SkillHistorySnapshotView,
	SkillLandscapeView,
} from "./skill-landscape-model";

export interface ProfileEvidenceRow extends ConceptProfileView {
	calibration: CalibrationTally;
}

export interface VisibleMemoryFact {
	id: number;
	key: string;
	value: string;
	source: string;
	confidence: number;
}

export interface ProfileTotals {
	attempts: number;
	passes: number;
	calls: number;
	rightCalls: number;
}

export interface ProfileEvidenceModel {
	rows: ProfileEvidenceRow[];
	started: ProfileEvidenceRow[];
	orderedStarted: ProfileEvidenceRow[];
	notStarted: ProfileEvidenceRow[];
	solidCount: number;
	explainedCount: number;
	totals: ProfileTotals;
}

export const PROFILE_CONCEPTS = [
	...lessons.map((lesson) => lesson.id),
	...optimizationConcepts.map((concept) => concept.id),
];

export const PROFILE_TITLES = new Map([
	...lessons.map((lesson) => [lesson.id, lesson.title] as const),
	...optimizationConcepts.map(
		(concept) => [concept.id, concept.title] as const,
	),
]);

export function titleForProfileConcept(concept: string): string {
	return PROFILE_TITLES.get(concept) ?? concept;
}

export function buildProfileEvidenceModel(
	rows: ProfileEvidenceRow[],
): ProfileEvidenceModel {
	const started = rows.filter((row) => row.opportunities > 0);
	const totals = started.reduce<ProfileTotals>(
		(acc, row) => ({
			attempts: acc.attempts + row.opportunities,
			passes: acc.passes + row.passes,
			calls:
				acc.calls +
				row.calibration.alignedConfident +
				row.calibration.overconfident +
				row.calibration.underconfident +
				row.calibration.alignedUnsure,
			rightCalls:
				acc.rightCalls +
				row.calibration.alignedConfident +
				row.calibration.alignedUnsure,
		}),
		{ attempts: 0, passes: 0, calls: 0, rightCalls: 0 },
	);

	return {
		rows,
		started,
		orderedStarted: [...started].sort(
			(left, right) => left.current - right.current,
		),
		notStarted: rows.filter((row) => row.opportunities === 0),
		solidCount: started.filter((row) => row.current >= 0.95).length,
		explainedCount: started.filter((row) => row.explanation === "correct")
			.length,
		totals,
	};
}

export function initialSkillLandscapeView(
	rows: ProfileEvidenceRow[],
): SkillLandscapeView {
	const learnAttempts = rows
		.filter((row) => !row.concept.startsWith("optimization-"))
		.reduce((sum, row) => sum + row.opportunities, 0);
	const optimizationAttempts = rows
		.filter((row) => row.concept.startsWith("optimization-"))
		.reduce((sum, row) => sum + row.opportunities, 0);
	return optimizationAttempts > learnAttempts ? "optimization" : "learn";
}

export function resolveProfileConcept(requested: string): string | undefined {
	const normalized = requested.trim().toLowerCase();
	return PROFILE_CONCEPTS.find(
		(concept) =>
			concept.toLowerCase() === normalized ||
			(PROFILE_TITLES.get(concept) ?? "").toLowerCase() === normalized,
	);
}

export function describeProfileSnapshot(
	history: SkillHistorySnapshotView[] | undefined,
	id: string | null,
): string {
	const snapshot = history?.find((entry) => entry.id === id);
	return snapshot
		? `session ${snapshot.sessionNumber}, id ${snapshot.id}, ending ${new Date(snapshot.endedAt).toLocaleString()}`
		: "no earlier-session overlay";
}

export function profileScreenSummary({
	evidence,
	memories,
	radarView,
	comparison,
	focusedConcept,
}: {
	evidence: ProfileEvidenceModel;
	memories: VisibleMemoryFact[];
	radarView: SkillLandscapeView;
	comparison: SkillHistorySnapshotView | undefined;
	focusedConcept: string | null;
}): string {
	const focus = evidence.orderedStarted.slice(0, 4).map((row) => {
		const mistake = row.mistakes[0];
		return `${row.concept}: ${row.passes}/${row.opportunities} passed${
			mistake ? `; most frequent error ${mistake.kind} (${mistake.count}x)` : ""
		}; teach-back ${row.explanation ?? "not checked"}`;
	});
	const saved = memories.map((fact) => `${fact.key}: ${fact.value}`).join("; ");

	return [
		"This is the exact student-visible learner profile. Discuss evidence as an estimate, never a verdict, and do not read mastery decimals aloud.",
		`Totals: ${evidence.totals.attempts} independent exercise episodes, ${evidence.totals.passes} passed; ${evidence.solidCount} of ${evidence.started.length} started concepts are solid; ${evidence.explainedCount} have a correct teach-back.`,
		focus.length > 0
			? `Lowest-current evidence: ${focus.join(" | ")}.`
			: "No submitted-query evidence yet.",
		saved ? `Visible saved memories: ${saved}.` : "No saved memories yet.",
		`The skill radar is showing ${radarView} topics with ${
			comparison
				? `a dashed comparison from session ${comparison.sessionNumber}`
				: "no earlier-session comparison"
		}. Spotlight: ${focusedConcept ?? "none"}.`,
		"Teaching preferences are only explicit, reversible preferences. Never infer a fixed learning style, ability, mood, or emotion from voice or behavior.",
	].join(" ");
}

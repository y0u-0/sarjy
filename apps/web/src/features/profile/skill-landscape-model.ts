import type { ConceptProfileView } from "@/components/practice/concept-card";

export type SkillLandscapeView = "learn" | "optimization";

export interface SkillHistorySnapshotView {
	id: string;
	sessionNumber: number;
	endedAt: Date | string;
	attempts: number;
	totalAttempts: number;
	profiles: Array<{
		concept: string;
		current: number;
		opportunities: number;
		passes: number;
	}>;
}

export interface SkillRadarPoint {
	concept: string;
	label: string;
	strength: number;
	passes: number;
	opportunities: number;
}

export function buildSkillLandscapeModel({
	profiles,
	history,
	view,
	comparisonId,
	focusedConcept,
	titleFor,
}: {
	profiles: ConceptProfileView[];
	history: SkillHistorySnapshotView[];
	view: SkillLandscapeView;
	comparisonId: string | null;
	focusedConcept: string | null;
	titleFor: (concept: string) => string;
}) {
	const rows = profiles.filter((profile) =>
		view === "optimization"
			? profile.concept.startsWith("optimization-")
			: !profile.concept.startsWith("optimization-"),
	);
	const comparison = history.find((snapshot) => snapshot.id === comparisonId);
	const comparisonByConcept = new Map(
		comparison?.profiles.map((profile) => [profile.concept, profile]) ?? [],
	);
	const comparisonRows = rows.map(
		(profile) =>
			comparisonByConcept.get(profile.concept) ?? {
				concept: profile.concept,
				current: 0,
				opportunities: 0,
				passes: 0,
			},
	);
	const changed = rows.reduce(
		(acc, profile) => {
			const then = comparisonByConcept.get(profile.concept)?.current ?? 0;
			const delta = profile.current - then;
			if (delta > 0.02) acc.grew += 1;
			if (delta < -0.02) acc.cooled += 1;
			return acc;
		},
		{ grew: 0, cooled: 0 },
	);
	const toChartPoint = (
		profile: (typeof comparisonRows)[number],
	): SkillRadarPoint => ({
		concept: profile.concept,
		label: titleFor(profile.concept),
		strength: Math.max(0, Math.min(100, profile.current * 100)),
		passes: profile.passes,
		opportunities: profile.opportunities,
	});

	return {
		rows,
		comparison,
		changed,
		focused: rows.find((row) => row.concept === focusedConcept) ?? null,
		totalAttempts: profiles.reduce(
			(sum, profile) => sum + profile.opportunities,
			0,
		),
		ariaSummary: rows
			.map(
				(profile) =>
					`${titleFor(profile.concept)}: ${profile.passes} right of ${profile.opportunities}`,
			)
			.join("; "),
		chartRows: rows.map(toChartPoint),
		comparisonChartRows: comparisonRows.map(toChartPoint),
	};
}

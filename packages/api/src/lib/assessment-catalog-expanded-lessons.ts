import type { QueueCandidate } from "./exercise-queue";

function lessonGroup(concept: string, ids: string[]): QueueCandidate[] {
	return ids.map((id, difficulty) => ({ id, concept, difficulty }));
}

export const EXPANDED_LESSON_CANDIDATES: QueueCandidate[] = [
	...lessonGroup("null-handling", [
		"null-find-unmatched",
		"null-count-matches",
		"null-coalesce",
		"null-nullif",
	]),
	...lessonGroup("set-operations", [
		"sets-union-locations",
		"sets-union-all-years",
		"sets-intersect-years",
		"sets-except-artists",
	]),
	...lessonGroup("self-joins", [
		"self-album-pairs",
		"self-country-peers",
		"self-city-peers",
		"self-consecutive-tracks",
	]),
	...lessonGroup("advanced-aggregation", [
		"agg-filtered-counts",
		"agg-conditional-units",
		"agg-genre-revenue",
		"agg-price-spread",
	]),
	...lessonGroup("ctes", [
		"cte-expensive-albums",
		"cte-artist-stats",
		"cte-two-stages",
		"cte-recursive-years",
	]),
	...lessonGroup("correlated-subqueries", [
		"corr-above-artist-average",
		"corr-longest-track",
		"corr-no-albums",
		"corr-every-world-album",
	]),
	...lessonGroup("window-ranking", [
		"window-global-price-rank",
		"window-album-track-rank",
		"window-top-two-per-artist",
		"window-customer-spend-rank",
	]),
	...lessonGroup("window-analytics", [
		"window-running-units",
		"window-previous-purchase",
		"window-vs-album-average",
		"window-rolling-three",
	]),
	...lessonGroup("date-text-analysis", [
		"date-monthly-purchases",
		"date-days-to-purchase",
		"text-email-usernames",
		"date-purchase-quarter",
	]),
	...lessonGroup("business-analytics", [
		"biz-customer-value",
		"biz-genre-share",
		"biz-year-over-year",
		"biz-top-album-per-genre",
	]),
];

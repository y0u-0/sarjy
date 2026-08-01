/** Canonical optimization submissions, mapped to their assessed concept. */
export const OPTIMIZATION_EXERCISE_CONCEPT = new Map<string, string>([
	["opt-scan-to-seek", "optimization-indexes"],
	["opt-sort-cost", "optimization-sorting"],
	["opt-composite-order", "optimization-composite"],
	["opt-join-without-index", "optimization-joins"],
	["opt-covering-index", "optimization-covering"],
	["opt-anti-join", "optimization-subqueries"],
	["opt-correlated-aggregate", "optimization-subqueries"],
	["opt-count-vs-exists", "optimization-short-circuit"],
	["opt-count-star", "optimization-aggregation"],
	["opt-correlated-in-select", "optimization-subqueries"],
	["opt-deep-offset", "optimization-pagination"],
	["opt-sargable-date", "optimization-sargability"],
	["opt-sargable-arithmetic", "optimization-sargability"],
	["opt-sargable-cast", "optimization-sargability"],
	["opt-order-without-limit", "optimization-result-shaping"],
	["opt-in-vs-join", "optimization-set-operations"],
	["opt-aggregate-before-join", "optimization-aggregation"],
	["opt-cte-reuse", "optimization-set-operations"],
	["opt-ctas-reuse", "optimization-materialization"],
]);

/** Canonical challenges produced from frozen external weather snapshots. */
export const LIVE_DATA_CHALLENGE_CONCEPT = new Map<string, string>([
	["live-weather-hottest-hours", "filtering-sorting"],
	["live-weather-city-summary", "advanced-aggregation"],
	["live-weather-moving-average", "window-analytics"],
]);

import type { OptimizationApproach } from "./approaches";

export const JOIN_APPROACHES: Record<string, OptimizationApproach[]> = {
	"join-without-index": [
		{
			technique: "Index",
			title: "Index plays.listener_id",
			fit: "best",
			effect:
				"Lets the planner scan 5,000 listeners and search matching plays instead of scanning 60,000 plays.",
			tradeoff:
				"The GROUP BY still needs separate work; this fixes the join access path, not every operator.",
		},
		{
			technique: "CTE",
			title: "Pre-aggregate plays by listener",
			fit: "viable",
			effect:
				"Shrinks 60,000 play rows to at most 5,000 listener totals before the join.",
			tradeoff:
				"Adds grouping work and wins only when the shrinkage outweighs it.",
		},
		{
			technique: "Rewrite",
			title: "Keep the original join order",
			fit: "situational",
			effect:
				"The original primary-key lookup is already targeted on listeners.",
			tradeoff:
				"It still drives 60,000 lookups because plays remains the outer scan.",
		},
		{
			technique: "CTAS",
			title: "Materialize listener totals",
			fit: "situational",
			effect:
				"Can help a family of reports reuse the same per-listener summary.",
			tradeoff:
				"Requires freshness rules and is excessive for one live report.",
		},
	],
	"covering-index": [
		{
			technique: "Index",
			title: "Cover with country",
			fit: "best",
			effect:
				"Searches the two country ranges and answers the grouping from the index alone.",
			tradeoff: "Still maintains an index on every write to plays.",
		},
		{
			technique: "Composite index",
			title: "Add unused columns to the index",
			fit: "poor",
			effect:
				"Does not improve coverage because country already contains everything this query reads.",
			tradeoff:
				"Makes the index wider and more expensive to maintain for no measured gain.",
		},
		{
			technique: "Rewrite",
			title: "Split countries with UNION ALL",
			fit: "situational",
			effect:
				"Can express two searches, but SQLite already handles the IN list using the same index.",
			tradeoff:
				"More SQL and duplicated aggregation logic without a guaranteed plan improvement.",
		},
		{
			technique: "CTAS",
			title: "Persist country totals",
			fit: "situational",
			effect: "Useful for a deliberately refreshed reporting snapshot.",
			tradeoff:
				"Can become stale; the covering index keeps the live answer simple.",
		},
	],
	"anti-join": [
		{
			technique: "Subquery",
			title: "Use NOT EXISTS",
			fit: "best",
			effect:
				"States the anti-join directly and can stop at the first matching row.",
			tradeoff:
				"A supporting index on the correlated key still matters on other datasets.",
		},
		{
			technique: "Rewrite",
			title: "LEFT JOIN … IS NULL",
			fit: "viable",
			effect:
				"Expresses the same anti-match when the nullable-side test is chosen correctly.",
			tradeoff:
				"Can create and then discard joined rows before proving no match.",
		},
		{
			technique: "Subquery",
			title: "Use NOT IN",
			fit: "situational",
			effect: "Can be compact when the subquery column is guaranteed NOT NULL.",
			tradeoff:
				"One NULL in the subquery changes three-valued-logic behavior and can invalidate the answer.",
		},
	],
	"correlated-aggregate": [
		{
			technique: "CTE",
			title: "Aggregate once, then join",
			fit: "best",
			effect: "Replaces repeated correlated aggregation with one grouped pass.",
			tradeoff:
				"The grouped intermediate must preserve empty-parent semantics with LEFT JOIN and COALESCE when needed.",
		},
		{
			technique: "Index",
			title: "Index the correlated key",
			fit: "viable",
			effect:
				"Makes each correlated lookup targeted instead of scanning the child table.",
			tradeoff: "Still executes one aggregate lookup per outer row.",
		},
		{
			technique: "CTAS",
			title: "Persist the grouped summary",
			fit: "situational",
			effect:
				"Can serve many reports that reuse the exact same stable aggregate.",
			tradeoff:
				"Storage, refreshes, and staleness make it wrong for a one-off query.",
		},
	],
};

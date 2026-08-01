import type { OptimizationApproach } from "./approaches";

export const ACCESS_APPROACHES: Record<string, OptimizationApproach[]> = {
	"scan-to-seek": [
		{
			technique: "Index",
			title: "Index country",
			fit: "best",
			effect:
				"Turns the table scan into a covering search for the matching country range.",
			tradeoff:
				"Adds storage and write maintenance, but only for the access path this query uses.",
		},
		{
			technique: "Composite index",
			title: "Add more columns after country",
			fit: "situational",
			effect:
				"Still supports the same search, but COUNT(*) already needs nothing beyond the country index and implicit rowid entries.",
			tradeoff:
				"A wider index consumes more space and write work without helping this query.",
		},
		{
			technique: "Rewrite",
			title: "Rewrite the COUNT query",
			fit: "poor",
			effect:
				"The predicate is already searchable; changing syntax cannot create a missing access path.",
			tradeoff:
				"More complex SQL with the same full scan when no usable index exists.",
		},
		{
			technique: "CTAS",
			title: "Materialize country counts",
			fit: "poor",
			effect:
				"Could make repeated historical reports cheap, but it does not stay current automatically.",
			tradeoff:
				"The summary can become stale and costs refresh logic for a simple live count.",
		},
	],
	"sort-cost": [
		{
			technique: "Index",
			title: "Index played_at",
			fit: "best",
			effect:
				"Lets SQLite walk newest-first and stop after ten rows without a temporary B-tree.",
			tradeoff:
				"Maintains another ordered structure whenever plays are inserted.",
		},
		{
			technique: "Composite index",
			title: "Cover played_at plus output columns",
			fit: "viable",
			effect:
				"Can avoid both the temporary B-tree and table lookups for the selected columns.",
			tradeoff: "Wider than necessary unless this exact projection is common.",
		},
		{
			technique: "Rewrite",
			title: "Top-N rewrite",
			fit: "poor",
			effect:
				"ORDER BY … LIMIT 10 already states the top-N requirement clearly.",
			tradeoff:
				"A subquery or CTE cannot supply the missing physical order by itself.",
		},
		{
			technique: "CTAS",
			title: "Snapshot recent plays",
			fit: "situational",
			effect:
				"Useful only when many consumers intentionally share a fixed snapshot.",
			tradeoff:
				"Refresh and staleness costs are excessive for a live recent-plays query.",
		},
	],
	"composite-order": [
		{
			technique: "Composite index",
			title: "Index (country, played_at)",
			fit: "best",
			effect: "Seeks to one country and reads that range in time order.",
			tradeoff:
				"Optimized for country-first questions; it cannot globally order all countries by time.",
		},
		{
			technique: "Composite index",
			title: "Index (played_at, country)",
			fit: "viable",
			effect:
				"Avoids the sort and can stop early when the requested country is common.",
			tradeoff:
				"It scans and rejects index entries; performance collapses when the country is rare.",
		},
		{
			technique: "Index",
			title: "Two separate single-column indexes",
			fit: "poor",
			effect:
				"SQLite usually chooses one access order; separate indexes do not jointly provide filtered ordering.",
			tradeoff:
				"Two write costs without the combined ordering this query needs.",
		},
		{
			technique: "CTAS",
			title: "Materialize country timelines",
			fit: "situational",
			effect: "Could serve a fixed analytics snapshot reused many times.",
			tradeoff:
				"Duplicates live data and needs refreshes; an index is the direct fit here.",
		},
	],
};

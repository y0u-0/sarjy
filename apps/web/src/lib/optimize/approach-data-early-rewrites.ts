import type { OptimizationApproach } from "./approaches";

export const EARLY_REWRITE_APPROACHES: Record<string, OptimizationApproach[]> =
	{
		"count-vs-exists": [
			{
				technique: "Subquery",
				title: "Use EXISTS",
				fit: "best",
				effect: "Stops as soon as the first qualifying row proves existence.",
				tradeoff:
					"Only valid when the question is yes/no, not when the count itself is required.",
			},
			{
				technique: "Rewrite",
				title: "Use a LIMIT 1 probe",
				fit: "viable",
				effect: "Also bounds the search after the first match.",
				tradeoff:
					"Usually less expressive than EXISTS and easier to compose incorrectly.",
			},
			{
				technique: "Index",
				title: "Index the existence predicate",
				fit: "viable",
				effect:
					"Reduces the work of either EXISTS or COUNT when the filter is selective.",
				tradeoff:
					"COUNT still visits every matching index entry; the index does not create short-circuit semantics.",
			},
		],
		"count-star": [
			{
				technique: "Rewrite",
				title: "Use COUNT(*)",
				fit: "best",
				effect: "Counts rows without decoding a nullable expression.",
				tradeoff:
					"COUNT(*) is not equivalent to COUNT(column) when that column can be NULL.",
			},
			{
				technique: "Rewrite",
				title: "Keep COUNT(id)",
				fit: "viable",
				effect: "Returns the same value here because id is NOT NULL.",
				tradeoff:
					"Does unnecessary expression work and teaches a rule that fails for nullable columns.",
			},
			{
				technique: "Index",
				title: "Add an index only for counting",
				fit: "poor",
				effect:
					"Does not remove the need to count all rows for this unfiltered result.",
				tradeoff:
					"Adds write and storage cost without changing the question's cardinality work.",
			},
		],
		"correlated-in-select": [
			{
				technique: "CTE",
				title: "Group once and LEFT JOIN",
				fit: "best",
				effect:
					"Computes every artist count in one pass, then attaches the result.",
				tradeoff:
					"Needs COALESCE to preserve zero rather than NULL for artists with no albums.",
			},
			{
				technique: "Index",
				title: "Index albums.artist_id",
				fit: "viable",
				effect:
					"Makes each correlated count search only one artist's album range.",
				tradeoff: "Still repeats a subquery for every artist row.",
			},
			{
				technique: "CTAS",
				title: "Persist artist counts",
				fit: "situational",
				effect:
					"Useful when many reports share a stable artist-count snapshot.",
				tradeoff: "Requires refresh logic and can return stale counts.",
			},
		],
		"deep-offset": [
			{
				technique: "Rewrite",
				title: "Use keyset pagination",
				fit: "best",
				effect: "Searches from the last seen key and reads only the next page.",
				tradeoff:
					"Needs a stable unique ordering key and does not jump directly to arbitrary page numbers.",
			},
			{
				technique: "Index",
				title: "Use a covering pagination index",
				fit: "viable",
				effect:
					"Can make each visited entry cheaper, especially for a multi-column order.",
				tradeoff:
					"OFFSET still advances past 50,000 entries even when they live in an index.",
			},
			{
				technique: "CTAS",
				title: "Materialize numbered pages",
				fit: "poor",
				effect: "Could serve a frozen export, not a changing interactive feed.",
				tradeoff:
					"Page membership becomes stale whenever rows are inserted or removed.",
			},
		],
		"sargable-date": [
			{
				technique: "Rewrite",
				title: "Use a half-open date range",
				fit: "best",
				effect:
					"Leaves purchase_date bare so the existing index can search a contiguous range.",
				tradeoff:
					"Boundary construction must match the stored time zone and precision.",
			},
			{
				technique: "Index",
				title: "Create an expression index",
				fit: "viable",
				effect:
					"Can support the exact strftime expression when that expression is used consistently.",
				tradeoff:
					"Specialized, larger, and less reusable than a normal date index.",
			},
			{
				technique: "CTAS",
				title: "Materialize yearly partitions",
				fit: "situational",
				effect:
					"Can help stable warehouse summaries reused across many reports.",
				tradeoff:
					"Adds refresh and storage costs to a predicate a range search already solves.",
			},
		],
	};

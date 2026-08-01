import type { OptimizationApproach } from "./approaches";

export const LATER_REWRITE_SHAPE_APPROACHES: Record<
	string,
	OptimizationApproach[]
> = {
	"aggregate-before-join": [
		{
			technique: "CTE",
			title: "Aggregate purchases before joining",
			fit: "best",
			effect:
				"Shrinks 80,000 purchases to 8,000 customer totals before key lookups.",
			tradeoff:
				"Can be slower when an earlier selective join would discard most purchases.",
		},
		{
			technique: "Rewrite",
			title: "Join first, aggregate later",
			fit: "situational",
			effect: "Wins when join filters remove most rows before grouping.",
			tradeoff:
				"On this unfiltered report it performs a lookup for every purchase.",
		},
		{
			technique: "CTAS",
			title: "Persist customer totals",
			fit: "situational",
			effect:
				"Can serve many reports that reuse the same stable customer-level aggregate.",
			tradeoff: "Needs incremental refresh or accepts stale analytics.",
		},
	],
	"cte-reuse": [
		{
			technique: "CTE",
			title: "Reuse one materialized CTE",
			fit: "best",
			effect:
				"Groups tracks once and lets both scalar consumers scan the smaller result.",
			tradeoff:
				"Materialization has a write/read cost, so reuse is what makes it worthwhile.",
		},
		{
			technique: "Subquery",
			title: "Inline the grouped subquery twice",
			fit: "poor",
			effect: "Keeps each consumer independent.",
			tradeoff:
				"Repeats the same scan and grouping work twice on this SQLite plan.",
		},
		{
			technique: "CTAS",
			title: "Persist album counts",
			fit: "viable",
			effect: "Extends reuse across multiple statements or reports.",
			tradeoff:
				"Adds lifecycle and freshness management that one statement does not need.",
		},
	],
	"ctas-reuse": [
		{
			technique: "CTAS",
			title: "Build the summary once",
			fit: "best",
			effect:
				"Pays for one grouping pass, then lets both consumers read 10,000 summary rows.",
			tradeoff:
				"The build cost and temporary writes must be included in the benchmark.",
		},
		{
			technique: "CTE",
			title: "Use a reused materialized CTE",
			fit: "viable",
			effect: "Achieves statement-local reuse without managing a named table.",
			tradeoff:
				"Cannot be shared with a later statement or another report execution.",
		},
		{
			technique: "Subquery",
			title: "Repeat the aggregation inline",
			fit: "poor",
			effect: "Avoids materialization setup.",
			tradeoff:
				"Scans and groups the 60,000-row source twice, which is the duplicated work being removed.",
		},
	],
};

import type { OptimizationApproach } from "./approaches";

export const LATER_REWRITE_ACCESS_APPROACHES: Record<
	string,
	OptimizationApproach[]
> = {
	"sargable-arithmetic": [
		{
			technique: "Rewrite",
			title: "Keep quantity bare",
			fit: "best",
			effect:
				"Allows the existing quantity index to perform an equality search.",
			tradeoff:
				"Algebraic movement is valid only when it preserves the predicate exactly.",
		},
		{
			technique: "Index",
			title: "Index the exact expression",
			fit: "viable",
			effect:
				"Supports quantity + 0 if the application truly standardizes on that expression.",
			tradeoff:
				"Maintains a specialized index for an expression that adds no business meaning here.",
		},
		{
			technique: "CTAS",
			title: "Store transformed quantities",
			fit: "poor",
			effect: "Duplicates a value that can be compared directly.",
			tradeoff:
				"Introduces consistency and refresh problems with no useful reduction in work.",
		},
	],
	"sargable-cast": [
		{
			technique: "Rewrite",
			title: "Compare the integer key directly",
			fit: "best",
			effect: "Restores a single-row INTEGER PRIMARY KEY search.",
			tradeoff:
				"The input must be validated as an integer at the application boundary.",
		},
		{
			technique: "Index",
			title: "Index CAST(id AS TEXT)",
			fit: "situational",
			effect:
				"Can serve unavoidable text-form identifiers using an expression index.",
			tradeoff:
				"Duplicates the primary key in a second representation and increases write cost.",
		},
		{
			technique: "CTAS",
			title: "Copy text-form identifiers",
			fit: "poor",
			effect:
				"Could make a frozen export convenient but does not improve the live key lookup design.",
			tradeoff: "Duplicates keys and can drift out of sync.",
		},
	],
	"order-without-limit": [
		{
			technique: "Rewrite",
			title: "State LIMIT 10",
			fit: "best",
			effect:
				"Lets SQLite keep a bounded top-N structure and avoids returning 59,990 unused rows.",
			tradeoff:
				"Intentionally changes the result, so it is valid only because the product needs ten rows.",
		},
		{
			technique: "Index",
			title: "Index duration_seconds",
			fit: "viable",
			effect: "Can provide order without a temporary B-tree.",
			tradeoff:
				"Without LIMIT the app still reads and transfers all 60,000 output rows.",
		},
		{
			technique: "Composite index",
			title: "Cover duration plus output",
			fit: "viable",
			effect: "Can provide order and avoid table lookups for id and title.",
			tradeoff:
				"A wide index is costly and still cannot fix an unnecessary 60,000-row result.",
		},
	],
	"in-vs-join": [
		{
			technique: "Subquery",
			title: "Use IN with a stable set",
			fit: "best",
			effect:
				"Builds the small Rock-album set once and probes it for purchases.",
			tradeoff:
				"This measured win is SQLite- and data-specific; it is not a universal IN rule.",
		},
		{
			technique: "Rewrite",
			title: "Keep the JOIN",
			fit: "viable",
			effect: "Produces the same answer through one album lookup per purchase.",
			tradeoff:
				"Measured slower on this fixture because it performs many separate b-tree descents.",
		},
		{
			technique: "Subquery",
			title: "Use EXISTS",
			fit: "situational",
			effect: "Expresses membership and can short-circuit matches.",
			tradeoff:
				"Measured about the same as JOIN here; syntax folklore is not evidence.",
		},
	],
};

import { ADVANCED_REWRITE_CHALLENGES } from "./rewrite-challenges-advanced";
import { CORE_REWRITE_CHALLENGES } from "./rewrite-challenges-core";

export type { RewriteChallenge, RewriteFamily } from "./rewrite-types";

import type { RewriteChallenge } from "./rewrite-types";

export const rewriteChallenges: RewriteChallenge[] = [
	...CORE_REWRITE_CHALLENGES,
	...ADVANCED_REWRITE_CHALLENGES,
];

export const debunkedRewrites = [
	{
		claim: "Rewrite OR as UNION ALL to help the planner",
		verdict:
			"Slower (0.88×) with no index, and a wash with indexes, because SQLite already does MULTI-INDEX OR.",
	},
	{
		claim: "A numeric string disables an integer index",
		verdict:
			"False in SQLite: type affinity converts the value and still uses the integer key. Casting the indexed column is what turns the seek into a scan.",
	},
	{
		claim: "Replace correlated subqueries with joins",
		verdict:
			"Only when the correlation is unindexed. On a primary-key correlation both compile to the same index seek and measured identically.",
	},
	{
		claim: "EXISTS is faster than a join",
		verdict:
			"Identical here (1.00×) — both perform the same 80,000 key lookups.",
	},
	{
		claim: "Push filters down into subqueries manually",
		verdict:
			"No effect: byte-identical plans. SQLite already pushes predicates down.",
	},
	{
		claim: "Add MATERIALIZED to reuse a CTE",
		verdict:
			"A no-op — multiple references are already materialized by default.",
	},
	{
		claim: "SELECT * makes SQLite read more of the table",
		verdict:
			"No. A COUNT-wrapped control shows the scan costs the same; the 2.2× win is per-row decoding and transfer, so the lesson is 'do not ship columns you will not use'.",
	},
	{
		claim: "DISTINCT and GROUP BY perform the same",
		verdict:
			"Cardinality-dependent. DISTINCT was 2.5× faster over 7 genres and a wash over 10,000 distinct values, so neither is a general rule.",
	},
] as const;

export function findRewrite(id: string): RewriteChallenge | undefined {
	return rewriteChallenges.find((challenge) => challenge.id === id);
}

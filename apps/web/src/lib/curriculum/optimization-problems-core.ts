import { PLAY_ROWS } from "./optimization-schema";
import type { OptimizationProblem } from "./optimization-types";

export const CORE_INDEX_PROBLEMS: OptimizationProblem[] = [
	{
		id: "scan-to-seek",
		title: "The full table scan",
		prompt:
			"This counts plays from Saudi Arabia. It reads **every one of the 60,000 rows** to find them. Look at the plan, then find the index that turns the scan into an indexed search.",
		sql: "SELECT COUNT(*) FROM plays WHERE country = 'SA'",
		concept: "optimization-indexes",
		goal: "SEARCH plays USING INDEX on country, instead of SCAN plays.",
		predictHint:
			"Before we run it: will an index on country make this faster, and roughly how much?",
		illustration: {
			table: "plays",
			totalRows: PLAY_ROWS,
			matchedSql: "SELECT COUNT(*) AS n FROM plays WHERE country = 'SA'",
			matchedLabel: "qualifying rows",
		},
		suggestions: [
			{
				label: "Index plays.country",
				sql: "CREATE INDEX idx_plays_country ON plays(country)",
				rationale:
					"The WHERE clause filters on country, so an index on that column lets SQLite jump straight to the matching rows.",
			},
			{
				label: "Index plays.ms_played",
				sql: "CREATE INDEX idx_plays_ms ON plays(ms_played)",
				rationale:
					"A decoy: indexing a column the query never filters on changes nothing.",
			},
		],
	},
	{
		id: "sort-cost",
		title: "The hidden sort",
		prompt:
			"Ten most recent plays. Watch for **USE TEMP B-TREE** — SQLite builds a temporary B-tree to order 60,000 rows just to hand you ten. SQLite may store that temporary structure in memory or on disk.",
		sql: "SELECT id, listener_id, played_at FROM plays ORDER BY played_at DESC LIMIT 10",
		concept: "optimization-sorting",
		goal: "No temp B-tree: the index supplies rows already in order.",
		predictHint:
			"You only want ten rows. Guess how many SQLite reads before it can give them to you.",
		illustration: {
			table: "plays",
			totalRows: PLAY_ROWS,
			matchedSql: "SELECT 10 AS n",
			matchedLabel: "requested output rows",
		},
		suggestions: [
			{
				label: "Index plays.played_at",
				sql: "CREATE INDEX idx_plays_played_at ON plays(played_at)",
				rationale:
					"An index is stored in sorted order, so ORDER BY can walk it backwards and stop after ten rows.",
			},
		],
	},
	{
		id: "composite-order",
		title: "Column order matters",
		prompt:
			"Filter by country **and** sort by time. Two indexes on the same two columns, in opposite order. Both make this faster — but they work in completely different ways. Apply each and read the plan carefully.",
		sql: "SELECT id, played_at FROM plays WHERE country = 'AE' ORDER BY played_at DESC LIMIT 20",
		concept: "optimization-composite",
		goal: "Tell a SEARCH on (country, played_at) apart from an ordered SCAN on (played_at, country), and know when each one wins.",
		predictHint:
			"Two indexes, same columns, opposite order. Predict whether the second one helps at all before we try it.",
		illustration: {
			table: "plays",
			totalRows: PLAY_ROWS,
			matchedSql: "SELECT 20 AS n",
			matchedLabel: "requested output rows",
		},
		suggestions: [
			{
				label: "Index (country, played_at)",
				sql: "CREATE INDEX idx_plays_country_time ON plays(country, played_at)",
				rationale:
					"Equality column first: SQLite seeks straight to 'AE', then reads those rows already in time order. A SEARCH.",
			},
			{
				label: "Index (played_at, country)",
				sql: "CREATE INDEX idx_plays_time_country ON plays(played_at, country)",
				rationale:
					"Sort column first: SQLite walks the index newest-first and discards rows that are not 'AE'. Fast here only because one row in six matches — it would fall apart if 'AE' were rare.",
			},
		],
	},
];

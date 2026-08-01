import { PLAY_ROWS } from "./optimization-schema";
import type { OptimizationProblem } from "./optimization-types";

export const ADVANCED_INDEX_PROBLEMS: OptimizationProblem[] = [
	{
		id: "join-without-index",
		title: "Flip the join loop",
		prompt:
			"Joining 60,000 plays to 5,000 listeners. The baseline scans every play and performs a primary-key lookup into listeners. Test whether indexing plays.listener_id lets SQLite start from the smaller listeners table instead.",
		sql: "SELECT l.country, COUNT(*) AS plays FROM plays p JOIN listeners l ON l.id = p.listener_id GROUP BY l.country",
		concept: "optimization-joins",
		goal: "SCAN the 5,000-row listeners table, then SEARCH plays by listener_id instead of full-scanning 60,000 plays.",
		predictHint:
			"Sixty thousand rows joining to five thousand. Predict whether an index on the foreign key helps much here.",
		illustration: {
			table: "plays",
			totalRows: PLAY_ROWS,
			// An aggregate over the whole table genuinely needs every row, so the
			// animation should say so. Counting the output groups here would claim
			// the query needs six rows, which is a lie the visual would tell loudly.
			matchedSql: "SELECT COUNT(*) AS n FROM plays",
			matchedLabel: "source rows aggregated",
		},
		suggestions: [
			{
				label: "Index plays.listener_id",
				sql: "CREATE INDEX idx_plays_listener ON plays(listener_id)",
				rationale:
					"Gives SQLite a searchable path from each listener to matching plays, allowing the planner to scan 5,000 listeners instead of 60,000 plays.",
			},
		],
	},
	{
		id: "covering-index",
		title: "Never touch the table",
		prompt:
			"This query only needs two columns. If the index already contains both, SQLite can answer entirely from the index and never read the table at all.",
		sql: "SELECT country, COUNT(*) FROM plays WHERE country IN ('SA', 'AE') GROUP BY country",
		concept: "optimization-covering",
		goal: "A COVERING INDEX step, meaning zero table reads.",
		predictHint:
			"This one needs only two columns. Predict whether SQLite still has to open the table at all.",
		illustration: {
			table: "plays",
			totalRows: PLAY_ROWS,
			matchedSql:
				"SELECT COUNT(*) AS n FROM plays WHERE country IN ('SA', 'AE')",
			matchedLabel: "qualifying rows",
		},
		suggestions: [
			{
				label: "Covering index (country)",
				sql: "CREATE INDEX idx_plays_country_cover ON plays(country)",
				rationale:
					"Every column the query needs lives in the index, so the table itself is never opened.",
			},
		],
	},
];

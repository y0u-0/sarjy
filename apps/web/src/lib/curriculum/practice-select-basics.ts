import type { AuthoredExercise } from "./practice-authoring";

export const selectBasicsPractice: Record<string, AuthoredExercise[]> = {
	"select-basics": [
		{
			id: "pool-long-tracks",
			title: "The long ones",
			prompt:
				"Some tracks run past the five-minute mark. Show the **title** and **duration_seconds** of every track longer than 300 seconds.",
			hint: "One table, one condition. Numbers do not need quotes.",
			referenceSql:
				"SELECT title, duration_seconds FROM tracks WHERE duration_seconds > 300",
			ordered: false,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["projection", "restriction"],
			},
		},
		{
			id: "pool-cairo-customers",
			title: "Regulars in Cairo",
			prompt:
				"The shop wants to invite its Cairo customers to a listening night. Show the **name** and **city** of every customer there.",
			hint: "Text values go in single quotes, and they are matched exactly.",
			referenceSql: "SELECT name, city FROM customers WHERE city = 'Cairo'",
			ordered: false,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["projection", "restriction"],
			},
		},
		{
			id: "pool-budget-albums",
			title: "Under twelve",
			prompt:
				"Show the **title** and **price** of every album that costs less than 12.",
			hint: "Strictly less than — an album at exactly 12 does not belong here.",
			referenceSql: "SELECT title, price FROM albums WHERE price < 12",
			ordered: false,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["projection", "restriction"],
			},
		},
		{
			id: "pool-recent-artists",
			title: "The newer signings",
			prompt:
				"Show the **name** and **formed_year** of every artist that formed in 2010 or later.",
			hint: '"Or later" includes 2010 itself.',
			referenceSql:
				"SELECT name, formed_year FROM artists WHERE formed_year >= 2010",
			ordered: false,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["projection", "restriction"],
			},
		},
		{
			id: "pool-folk-albums",
			title: "Just the folk records",
			prompt: "Show the **title** of every album in the Folk genre.",
			hint: "Genre is stored as text. Compare it to a quoted string, not to a bare word — a bare word is read as a column name.",
			referenceSql: "SELECT title FROM albums WHERE genre = 'Folk'",
			ordered: false,
			variant: "neighbour",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 8,
				concepts: ["restriction", "character-data"],
			},
		},
		{
			id: "pool-not-usa",
			title: "Everyone but the Americans",
			prompt:
				"Show the **name** and **country** of every artist that did *not* form in the USA.",
			hint: "Count your rows before you submit. There are nine artists in total — how many should come back?",
			referenceSql: "SELECT name, country FROM artists WHERE country <> 'USA'",
			ordered: false,
			variant: "trap",
			exposes: ["LOG-1:53", "LOG-1:54"],
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["restriction", "negation"],
			},
		},
	],
};

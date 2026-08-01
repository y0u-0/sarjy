import type { AuthoredExercise } from "./practice-authoring";

export const filteringSortingPractice: Record<string, AuthoredExercise[]> = {
	"filtering-sorting": [
		{
			id: "pool-rock-or-folk",
			title: "Two genres, priciest first",
			prompt:
				"Show the **title**, **genre** and **price** of every Rock or Folk album, most expensive first.",
			hint: "Two acceptable values for one column, then a descending sort.",
			referenceSql:
				"SELECT title, genre, price FROM albums WHERE genre IN ('Rock', 'Folk') ORDER BY price DESC",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 17,
				concepts: ["restriction", "set-membership", "ordering"],
			},
		},
		{
			id: "pool-light-tracks",
			title: "Something about light",
			prompt:
				'Show the **title** of every track with the word "Light" somewhere in it.',
			hint: "Pattern matching, not equality. The wildcard that stands for any run of characters is %.",
			referenceSql: "SELECT title FROM tracks WHERE title LIKE '%Light%'",
			ordered: false,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["restriction", "wildcard"],
			},
		},
		{
			id: "pool-joined-2023",
			title: "The 2023 intake",
			prompt:
				"Show the **name** and **joined_date** of every customer who joined during 2023 or later, earliest first.",
			hint: "These dates are stored as text in YYYY-MM-DD form, which means they sort and compare correctly as text.",
			referenceSql:
				"SELECT name, joined_date FROM customers WHERE joined_date >= '2023-01-01' ORDER BY joined_date",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 13,
				concepts: ["restriction", "ordering", "date-as-text"],
			},
		},
		{
			id: "pool-mid-price",
			title: "The middle of the rack",
			prompt:
				"Show the **title** and **price** of every album priced from 12 to 16 inclusive, in alphabetical order by title.",
			hint: "Inclusive at both ends.",
			referenceSql:
				"SELECT title, price FROM albums WHERE price BETWEEN 12 AND 16 ORDER BY title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 14,
				concepts: ["restriction", "range", "ordering"],
			},
		},
		{
			id: "pool-synthpop-recent",
			title: "Synthpop, but only the recent stuff",
			prompt:
				"Show the **title** and **release_year** of albums that are Synthpop **and** came out after 2010.",
			hint: "Both conditions have to hold for the same row. If you get more rows than there are Synthpop albums, you have joined the conditions the wrong way.",
			referenceSql:
				"SELECT title, release_year FROM albums WHERE genre = 'Synthpop' AND release_year > 2010",
			ordered: false,
			variant: "neighbour",
			exposes: ["LOG-1:52", "SEM-1:39"],
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 15,
				concepts: ["restriction", "conjunction"],
			},
		},
		{
			id: "pool-five-letter-tracks",
			title: "Exactly five letters",
			prompt:
				"Show the **title** of every track whose name is exactly five characters long.",
			hint: 'There is a wildcard for "any run of characters" and a different one for "exactly one character". This needs the second.',
			referenceSql: "SELECT title FROM tracks WHERE title LIKE '_____'",
			ordered: false,
			variant: "neighbour",
			exposes: ["SEM-1:44"],
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["restriction", "wildcard"],
			},
		},
		{
			id: "pool-cheapest-three",
			title: "The three cheapest",
			prompt:
				"Show the **title** and **price** of the three cheapest albums, cheapest first.",
			hint: "Sorting decides the order. Something else decides how many rows come back — you need both.",
			referenceSql: "SELECT title, price FROM albums ORDER BY price LIMIT 3",
			ordered: true,
			variant: "trap",
			exposes: ["LOG-5:76", "LOG-5:77"],
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 12,
				concepts: ["ordering", "limit"],
			},
		},
	],
};

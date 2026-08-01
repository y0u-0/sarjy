import type { AuthoredExercise } from "./practice-authoring";

export const expressionsPractice: Record<string, AuthoredExercise[]> = {
	expressions: [
		{
			id: "pool-price-bands",
			title: "Shelve them by price",
			prompt:
				"Label every album by price: under 12 is `budget`, 12 up to under 16 is `standard`, and 16 or more is `premium`. Show **title** and the label as **band**, alphabetically by title.",
			hint: "The conditions are tested in order, so the first one that matches wins.",
			referenceSql:
				"SELECT title, CASE WHEN price < 12 THEN 'budget' WHEN price < 16 THEN 'standard' ELSE 'premium' END AS band FROM albums ORDER BY title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 30,
				concepts: ["expressions", "conditional"],
			},
		},
		{
			id: "pool-artist-label",
			title: "Name and country as one string",
			prompt:
				"Show each artist as a single column called **label**, formatted like `Los Soles (Mexico)`. Alphabetical by the artist's name.",
			hint: "Two pipes join strings together. The brackets are literal text.",
			referenceSql:
				"SELECT name || ' (' || country || ')' AS label FROM artists ORDER BY name",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 18,
				concepts: ["expressions", "string-concat", "ordering"],
			},
		},
		{
			id: "pool-purchase-years",
			title: "Sales by year",
			prompt:
				"How many purchases happened in each calendar year? Show the year as **year** and the count as **n**, earliest year first.",
			hint: "The dates are text. Pull the year part out of them, and group on that.",
			referenceSql:
				"SELECT strftime('%Y', purchase_date) AS year, COUNT(*) AS n FROM purchases GROUP BY year ORDER BY year",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 22,
				concepts: ["expressions", "dates", "grouping"],
			},
		},
		{
			id: "pool-track-minutes",
			title: "In minutes, to one decimal",
			prompt:
				"Show each track's **title** and its length in minutes as **minutes**, rounded to one decimal place. Alphabetical by title.",
			hint: "Dividing two whole numbers throws the remainder away. Make one side a decimal to stop that happening.",
			referenceSql:
				"SELECT title, ROUND(duration_seconds / 60.0, 1) AS minutes FROM tracks ORDER BY title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 18,
				concepts: ["expressions", "numeric-types"],
			},
		},
		{
			id: "pool-decade-label",
			title: "Label the decade, keep everything",
			prompt:
				"Label every album `this decade` if it came out between 2010 and 2019 inclusive, and `other` otherwise. Show **title** and the label as **era**, alphabetically by title. All fifteen albums should appear.",
			hint: "This one labels rows rather than removing them. If your answer has fewer than fifteen rows, you filtered when you should have labelled.",
			referenceSql:
				"SELECT title, CASE WHEN release_year BETWEEN 2010 AND 2019 THEN 'this decade' ELSE 'other' END AS era FROM albums ORDER BY title",
			ordered: true,
			variant: "neighbour",
			exposes: ["LOG-4:69", "LOG-4:68"],
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 28,
				concepts: ["expressions", "conditional", "restriction-vs-projection"],
			},
		},
		{
			id: "pool-first-half-joiners",
			title: "Joined in the first half of the year",
			prompt:
				"Show the **name** and **joined_date** of every customer who joined in January through June of any year, earliest date first.",
			hint: "The month is buried inside a text date, and it comes out as text too — compare it as a number if you want a range.",
			referenceSql:
				"SELECT name, joined_date FROM customers WHERE CAST(strftime('%m', joined_date) AS INTEGER) <= 6 ORDER BY joined_date",
			ordered: true,
			variant: "neighbour",
			exposes: ["SYN-3:13"],
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 24,
				concepts: ["expressions", "dates", "numeric-types"],
			},
		},
		{
			id: "pool-minutes-and-seconds",
			title: "Three minutes thirty-five",
			prompt:
				"Show each track's **title**, its whole minutes as **mins**, and the leftover seconds as **secs**. Alphabetical by title.",
			hint: "Here you *want* the division to throw the remainder away — and then you want the remainder back separately.",
			referenceSql:
				"SELECT title, duration_seconds / 60 AS mins, duration_seconds % 60 AS secs FROM tracks ORDER BY title",
			ordered: true,
			variant: "trap",
			exposes: ["SYN-3:13"],
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 22,
				concepts: ["expressions", "numeric-types"],
			},
		},
	],
};

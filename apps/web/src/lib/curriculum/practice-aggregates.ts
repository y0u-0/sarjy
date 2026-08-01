import type { AuthoredExercise } from "./practice-authoring";

export const aggregatesPractice: Record<string, AuthoredExercise[]> = {
	aggregates: [
		{
			id: "pool-albums-per-genre",
			title: "How deep is each genre",
			prompt:
				"For each **genre**, show the genre and how many albums it holds as **album_count**, in alphabetical order by genre.",
			hint: "One output row per distinct genre.",
			referenceSql:
				"SELECT genre, COUNT(*) AS album_count FROM albums GROUP BY genre ORDER BY genre",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 15,
				concepts: ["grouping", "aggregate-function", "ordering"],
			},
		},
		{
			id: "pool-avg-price-per-artist",
			title: "What each artist costs on average",
			prompt:
				"For each **artist_id**, show the artist_id and the average price of their albums as **avg_price**, rounded to 2 decimal places, lowest artist_id first.",
			hint: "Group by the thing you want one row per.",
			referenceSql:
				"SELECT artist_id, ROUND(AVG(price), 2) AS avg_price FROM albums GROUP BY artist_id ORDER BY artist_id",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 20,
				concepts: ["grouping", "aggregate-function", "expressions"],
			},
		},
		{
			id: "pool-quantity-per-customer",
			title: "Units shifted per customer",
			prompt:
				"For each **customer_id**, show the customer_id and the total quantity they have bought as **units**, lowest customer_id first.",
			hint: "Adding up a column across a group, not counting rows.",
			referenceSql:
				"SELECT customer_id, SUM(quantity) AS units FROM purchases GROUP BY customer_id ORDER BY customer_id",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 16,
				concepts: ["grouping", "aggregate-function"],
			},
		},
		{
			id: "pool-longest-per-album",
			title: "Longest track on each album",
			prompt:
				"For each **album_id** that has tracks, show the album_id and the duration of its longest track as **longest**, lowest album_id first.",
			hint: "There is an aggregate for the largest value in a group.",
			referenceSql:
				"SELECT album_id, MAX(duration_seconds) AS longest FROM tracks GROUP BY album_id ORDER BY album_id",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 16,
				concepts: ["grouping", "aggregate-function"],
			},
		},
		{
			id: "pool-pricey-genres",
			title: "Genres with real depth at the top end",
			prompt:
				"Counting only albums priced above 12, show each **genre** that has more than one such album, with the count as **n**, in alphabetical order.",
			hint: "One of these two conditions filters individual albums before grouping; the other filters whole groups afterwards. They are different clauses and they are not interchangeable.",
			referenceSql:
				"SELECT genre, COUNT(*) AS n FROM albums WHERE price > 12 GROUP BY genre HAVING COUNT(*) > 1 ORDER BY genre",
			ordered: true,
			variant: "neighbour",
			exposes: ["SYN-5:17", "LOG-4:69"],
			complexity: {
				tables: 1,
				clauses: 6,
				nestingDepth: 0,
				solutionTokens: 24,
				concepts: [
					"grouping",
					"grouping-restrictions",
					"aggregate-function",
					"ordering",
				],
			},
		},
		{
			id: "pool-distinct-genres-per-artist",
			title: "How many genres does each artist work in",
			prompt:
				"For each **artist_id**, show the artist_id and how many *different* genres their albums span as **genres**, lowest artist_id first.",
			hint: "Artist 1 has three albums but does not work in three genres. Counting rows and counting distinct values are different questions.",
			referenceSql:
				"SELECT artist_id, COUNT(DISTINCT genre) AS genres FROM albums GROUP BY artist_id ORDER BY artist_id",
			ordered: true,
			variant: "neighbour",
			exposes: ["LOG-6:79"],
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 18,
				concepts: ["grouping", "aggregate-function", "distinct"],
			},
		},
		{
			id: "pool-genre-list",
			title: "One row per genre, nothing else",
			prompt:
				"List every **genre** the shop stocks, once each, in alphabetical order.",
			hint: "You are not aggregating anything here — you only want the duplicates gone. There is a shorter way than grouping.",
			referenceSql: "SELECT DISTINCT genre FROM albums ORDER BY genre",
			ordered: true,
			variant: "neighbour",
			exposes: ["COMP:97"],
			complexity: {
				tables: 1,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 9,
				concepts: ["distinct", "ordering"],
			},
		},
		{
			id: "pool-units-not-orders",
			title: "Copies, not orders",
			prompt:
				"How many *copies* has each customer taken home? Show **customer_id** and the total as **copies**, lowest customer_id first. A single order can be for more than one copy.",
			hint: "Customer 3 placed two orders. They did not go home with two albums. Check the quantity column before you decide which function you need.",
			referenceSql:
				"SELECT customer_id, SUM(quantity) AS copies FROM purchases GROUP BY customer_id ORDER BY customer_id",
			ordered: true,
			variant: "trap",
			exposes: ["LOG-6:80", "LOG-6:81"],
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 16,
				concepts: ["grouping", "aggregate-function"],
			},
		},
	],
};

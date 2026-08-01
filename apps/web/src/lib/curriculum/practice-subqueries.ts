import type { AuthoredExercise } from "./practice-authoring";

export const subqueriesPractice: Record<string, AuthoredExercise[]> = {
	subqueries: [
		{
			id: "pool-above-average-price",
			title: "Pricier than typical",
			prompt:
				"Show the **title** and **price** of every album that costs more than the average album, most expensive first.",
			hint: "You cannot put an aggregate straight into WHERE. Work out the average separately, in brackets.",
			referenceSql:
				"SELECT title, price FROM albums WHERE price > (SELECT AVG(price) FROM albums) ORDER BY price DESC",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 1,
				solutionTokens: 19,
				concepts: ["nesting", "aggregate-vs-column-value", "ordering"],
			},
		},
		{
			id: "pool-artists-with-albums",
			title: "The ones who released something",
			prompt:
				"Show the **name** of every artist who has at least one album, alphabetically.",
			hint: "The inner query produces a list of ids; the outer one keeps artists whose id is in that list.",
			referenceSql:
				"SELECT name FROM artists WHERE id IN (SELECT artist_id FROM albums) ORDER BY name",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 2,
				clauses: 4,
				nestingDepth: 1,
				solutionTokens: 17,
				concepts: ["nesting", "set-membership", "ordering"],
			},
		},
		{
			id: "pool-longer-than-album-average",
			title: "The standouts on each record",
			prompt:
				"Show the **title** of every track that runs longer than the average track on its own album, alphabetically.",
			hint: "The average is different for every row you test, so the inner query has to know which album the outer row belongs to.",
			referenceSql:
				"SELECT title FROM tracks t WHERE duration_seconds > (SELECT AVG(duration_seconds) FROM tracks WHERE album_id = t.album_id) ORDER BY title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 1,
				clauses: 4,
				nestingDepth: 1,
				solutionTokens: 28,
				concepts: [
					"nesting",
					"correlated-subquery",
					"aggregate-vs-column-value",
				],
			},
		},
		{
			id: "pool-no-albums-not-exists",
			title: "Nothing to their name",
			prompt:
				"Show the **name** of every artist for whom no album exists — this time without using a join.",
			hint: "You want to test whether anything at all comes back from the inner query. Comparing ids with a not-equals will not do it: that asks a different question.",
			referenceSql:
				"SELECT name FROM artists WHERE NOT EXISTS (SELECT 1 FROM albums WHERE albums.artist_id = artists.id)",
			ordered: false,
			variant: "neighbour",
			exposes: ["LOG-1:55", "LOG-1:56"],
			complexity: {
				tables: 2,
				clauses: 3,
				nestingDepth: 1,
				solutionTokens: 21,
				concepts: ["nesting", "does-not-exist", "correlated-subquery"],
			},
		},
		{
			id: "pool-world-buyers",
			title: "Who is into World music",
			prompt:
				"Show the **name** of every customer who has bought at least one World album, alphabetically. Each customer should appear once, however many they bought.",
			hint: "One customer here bought two World albums. If they show up twice, you are returning one row per purchase rather than one row per customer.",
			referenceSql:
				"SELECT name FROM customers WHERE id IN (SELECT purchases.customer_id FROM purchases JOIN albums ON purchases.album_id = albums.id WHERE albums.genre = 'World') ORDER BY name",
			ordered: true,
			variant: "trap",
			exposes: ["SEM-4:49", "LOG-5:72"],
			complexity: {
				tables: 3,
				clauses: 4,
				nestingDepth: 1,
				solutionTokens: 34,
				concepts: ["nesting", "set-membership", "multi-table", "duplicates"],
			},
		},
		{
			id: "pool-top-buyers",
			title: "Nobody outbought them",
			prompt:
				"Which customers took home the most copies? Show **name** and their total as **copies**, alphabetically. Careful — there may be more than one.",
			hint: "Work out every customer's total, then find the biggest of those totals, then keep the customers who match it. That is two levels of nesting.",
			referenceSql:
				"SELECT customers.name, SUM(purchases.quantity) AS copies FROM purchases JOIN customers ON purchases.customer_id = customers.id GROUP BY customers.id, customers.name HAVING SUM(purchases.quantity) = (SELECT MAX(total) FROM (SELECT SUM(quantity) AS total FROM purchases GROUP BY customer_id)) ORDER BY customers.name",
			ordered: true,
			variant: "neighbour",
			exposes: ["LOG-3:64", "SYN-5:16"],
			complexity: {
				tables: 2,
				clauses: 6,
				nestingDepth: 2,
				solutionTokens: 52,
				concepts: [
					"nesting",
					"grouping",
					"grouping-restrictions",
					"aggregate-vs-column-value",
					"multi-table",
				],
			},
		},
		{
			id: "pool-released-since-2015",
			title: "Still putting records out",
			prompt:
				"Show the **name** of every artist with at least one album released after 2015, alphabetically.",
			hint: "You only need to know whether such an album exists — you never need its values.",
			referenceSql:
				"SELECT name FROM artists WHERE EXISTS (SELECT 1 FROM albums WHERE albums.artist_id = artists.id AND albums.release_year > 2015) ORDER BY name",
			ordered: true,
			variant: "neighbour",
			exposes: ["COMP:90", "COMP:89"],
			complexity: {
				tables: 2,
				clauses: 4,
				nestingDepth: 1,
				solutionTokens: 27,
				concepts: ["nesting", "correlated-subquery", "ordering"],
			},
		},
	],
};

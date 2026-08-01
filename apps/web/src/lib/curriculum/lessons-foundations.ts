import type { Lesson } from "./types";

export const foundationLessons: Lesson[] = [
	{
		id: "select-basics",
		title: "SELECT Basics",
		summary: "Read rows and columns from a table.",
		concept:
			"Every query starts with SELECT. You pick columns (or * for all of them), name a table with FROM, and optionally keep only matching rows with WHERE. Example: SELECT name FROM artists WHERE country = 'UK'",
		exercises: [
			{
				id: "select-everything",
				title: "Select everything",
				prompt:
					"The shop keeps its musicians in the **artists** table. Fetch every column for every artist.",
				hint: "SELECT * FROM table_name returns all columns of all rows.",
				referenceSql: "SELECT * FROM artists",
				ordered: false,
			},
			{
				id: "choosing-columns",
				title: "Choosing columns",
				prompt: "List only the **title** and **price** of every album.",
				hint: "Name the columns you want after SELECT, separated by commas.",
				referenceSql: "SELECT title, price FROM albums",
				ordered: false,
			},
			{
				id: "filtering-rows",
				title: "Filtering rows",
				prompt: "Show the **title** of every album in the 'Rock' genre.",
				hint: "Add WHERE genre = 'Rock'. Text values go in single quotes.",
				referenceSql: "SELECT title FROM albums WHERE genre = 'Rock'",
				ordered: false,
			},
			{
				id: "comparisons",
				title: "Comparisons",
				prompt:
					"Find every track longer than 250 seconds. Return its **title** and **duration_seconds**.",
				hint: "WHERE works with >, <, >=, <= and <> for numbers.",
				referenceSql:
					"SELECT title, duration_seconds FROM tracks WHERE duration_seconds > 250",
				ordered: false,
			},
		],
	},
	{
		id: "filtering-sorting",
		title: "Filtering & Sorting",
		summary: "Combine conditions, sort results, and limit output.",
		concept:
			"Conditions combine with AND/OR, match sets with IN, and patterns with LIKE ('%' matches anything). ORDER BY sorts the result (ASC by default, DESC to reverse) and LIMIT keeps only the first rows.",
		exercises: [
			{
				id: "and-or",
				title: "Combining conditions",
				prompt:
					"List the **title** and **release_year** of albums released after 2010 that cost less than 15 (price).",
				hint: "Combine two conditions with AND.",
				referenceSql:
					"SELECT title, release_year FROM albums WHERE release_year > 2010 AND price < 15",
				ordered: false,
			},
			{
				id: "in-operator",
				title: "Matching a set",
				prompt:
					"Show the **name** and **country** of artists from the UK or the USA. Use IN.",
				hint: "WHERE country IN ('UK', 'USA') is cleaner than two ORs.",
				referenceSql:
					"SELECT name, country FROM artists WHERE country IN ('UK', 'USA')",
				ordered: false,
			},
			{
				id: "like-patterns",
				title: "Pattern matching",
				prompt:
					"Find every track whose **title** starts with the word 'Paper'.",
				hint: "LIKE 'Paper%' matches titles beginning with Paper.",
				referenceSql: "SELECT title FROM tracks WHERE title LIKE 'Paper%'",
				ordered: false,
			},
			{
				id: "order-by",
				title: "Sorting",
				prompt:
					"List every album's **title** and **price**, from most expensive to cheapest.",
				hint: "ORDER BY price DESC sorts high to low.",
				referenceSql: "SELECT title, price FROM albums ORDER BY price DESC",
				ordered: true,
			},
			{
				id: "limit",
				title: "Top N",
				prompt:
					"Return the **title** and **duration_seconds** of the 3 longest tracks, longest first.",
				hint: "Sort descending, then LIMIT 3.",
				referenceSql:
					"SELECT title, duration_seconds FROM tracks ORDER BY duration_seconds DESC LIMIT 3",
				ordered: true,
			},
		],
	},
];

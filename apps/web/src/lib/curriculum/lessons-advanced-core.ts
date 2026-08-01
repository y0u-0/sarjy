import type { Lesson } from "./types";

export const advancedCoreLessons: Lesson[] = [
	{
		id: "subqueries",
		title: "Subqueries & Sets",
		summary: "Nest queries inside queries and combine results.",
		concept:
			"A subquery in parentheses can act as a single value (scalar) or a set for IN. UNION stacks two results with the same columns, removing duplicates.",
		exercises: [
			{
				id: "scalar-subquery",
				title: "Compare to a computed value",
				prompt:
					"Find tracks longer than the average track length. Return **title** and **duration_seconds**.",
				hint: "Use (SELECT AVG(duration_seconds) FROM tracks) as the comparison value.",
				referenceSql:
					"SELECT title, duration_seconds FROM tracks WHERE duration_seconds > (SELECT AVG(duration_seconds) FROM tracks)",
				ordered: false,
			},
			{
				id: "in-subquery",
				title: "IN with a subquery",
				prompt:
					"List the **title** of every album by a UK artist, without using a JOIN.",
				hint: "WHERE artist_id IN (SELECT id FROM artists WHERE ...).",
				referenceSql:
					"SELECT title FROM albums WHERE artist_id IN (SELECT id FROM artists WHERE country = 'UK')",
				ordered: false,
			},
			{
				id: "union",
				title: "Combining results",
				prompt:
					"Build one list of every artist name and every customer name, in a single column called **name**.",
				hint: "Two SELECTs glued with UNION; both must return one column.",
				referenceSql:
					"SELECT name FROM artists UNION SELECT name FROM customers",
				ordered: false,
			},
		],
	},
	{
		id: "expressions",
		title: "Expressions & Functions",
		summary: "Transform values with CASE, string, date, and math functions.",
		concept:
			"Columns can be computed: CASE WHEN ... THEN ... END for conditional values, || for text concatenation, UPPER/LOWER for case, strftime for date parts, and arithmetic everywhere. Always name computed columns with AS.",
		exercises: [
			{
				id: "case-when",
				title: "Conditional labels",
				prompt:
					"Label each album's price: 'budget' when under 12, 'standard' when under 16, otherwise 'premium'. Return **title** and the label as **price_tier**.",
				hint: "CASE WHEN price < 12 THEN 'budget' WHEN price < 16 THEN ... ELSE ... END.",
				referenceSql:
					"SELECT title, CASE WHEN price < 12 THEN 'budget' WHEN price < 16 THEN 'standard' ELSE 'premium' END AS price_tier FROM albums",
				ordered: false,
			},
			{
				id: "string-concat",
				title: "Building text",
				prompt:
					"Produce a label like 'The Midnight Echoes (UK)' for each artist. Name the column **artist_label**.",
				hint: "Concatenate with ||: name || ' (' || country || ')'.",
				referenceSql:
					"SELECT name || ' (' || country || ')' AS artist_label FROM artists",
				ordered: false,
			},
			{
				id: "dates",
				title: "Working with dates",
				prompt:
					"List the **id** and **purchase_date** of every purchase made in 2023.",
				hint: "strftime('%Y', purchase_date) extracts the year as text; compare it to '2023'.",
				referenceSql:
					"SELECT id, purchase_date FROM purchases WHERE strftime('%Y', purchase_date) = '2023'",
				ordered: false,
			},
			{
				id: "capstone-revenue",
				title: "Capstone: revenue report",
				prompt:
					"Compute each album's total revenue (price × quantity over all its purchases), rounded to 2 decimals. Return the album **title** and the revenue as **revenue**. Albums never purchased should not appear.",
				hint: "Join albums to purchases, GROUP BY the album, SUM(price * quantity).",
				referenceSql:
					"SELECT albums.title, ROUND(SUM(albums.price * purchases.quantity), 2) AS revenue FROM albums JOIN purchases ON purchases.album_id = albums.id GROUP BY albums.id",
				ordered: false,
			},
		],
	},
];

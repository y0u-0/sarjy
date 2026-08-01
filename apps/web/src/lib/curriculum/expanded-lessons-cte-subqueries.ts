import { exercise } from "./lesson-authoring";
import type { Lesson } from "./types";

export const CteAndSubqueryLessons: Lesson[] = [
	{
		id: "ctes",
		title: "Common Table Expressions",
		summary: "Name intermediate results and build complex queries in stages.",
		concept:
			"WITH gives an intermediate query a name. CTEs make multi-stage logic readable, can be chained, and can join back to base tables. WITH RECURSIVE can generate a sequence one row at a time.",
		exercises: [
			exercise(
				"cte-expensive-albums",
				"Name the filtered set",
				"Use a CTE named `premium` for albums priced at 16 or more. Return its **title** and **price**, most expensive first.",
				"Define premium after WITH, then select from it like a table.",
				"WITH premium AS (SELECT title, price FROM albums WHERE price >= 16) SELECT title, price FROM premium ORDER BY price DESC, title",
				true,
			),
			exercise(
				"cte-artist-stats",
				"Aggregate, then add the name",
				"Use a CTE to count albums per artist_id, then return artist **name** and **album_count** for artists with at least two albums. Sort by count descending, then name.",
				"The CTE should group albums. Join that smaller result to artists afterwards.",
				"WITH album_counts AS (SELECT artist_id, COUNT(*) AS album_count FROM albums GROUP BY artist_id) SELECT artists.name, album_counts.album_count FROM album_counts JOIN artists ON artists.id = album_counts.artist_id WHERE album_counts.album_count >= 2 ORDER BY album_counts.album_count DESC, artists.name",
				true,
			),
			exercise(
				"cte-two-stages",
				"Two named stages",
				"Using at least two CTEs, calculate each customer's total copies and keep only the maximum. Return every tied **name** and **copies**, alphabetically.",
				"First total by customer, then compute the maximum of those totals, then compare against it.",
				"WITH customer_units AS (SELECT customer_id, SUM(quantity) AS copies FROM purchases GROUP BY customer_id), maximum_units AS (SELECT MAX(copies) AS copies FROM customer_units) SELECT customers.name, customer_units.copies FROM customer_units JOIN maximum_units ON customer_units.copies = maximum_units.copies JOIN customers ON customers.id = customer_units.customer_id ORDER BY customers.name",
				true,
			),
			exercise(
				"cte-recursive-years",
				"Build the missing years",
				"Use a recursive CTE to produce 2021 through 2024. Return every **year** and its purchase count as **purchase_count**, including years with none.",
				"Seed the CTE with 2021, repeatedly add 1 while below 2024, then LEFT JOIN purchases by extracted year.",
				"WITH RECURSIVE years(year) AS (VALUES(2021) UNION ALL SELECT year + 1 FROM years WHERE year < 2024) SELECT years.year, COUNT(purchases.id) AS purchase_count FROM years LEFT JOIN purchases ON CAST(strftime('%Y', purchases.purchase_date) AS INTEGER) = years.year GROUP BY years.year ORDER BY years.year",
				true,
			),
		],
	},
	{
		id: "correlated-subqueries",
		title: "Correlated Subqueries",
		summary: "Evaluate a nested question for each outer row.",
		concept:
			"A correlated subquery refers to the current row of the outer query. It handles per-group comparisons, EXISTS checks, anti-joins, and all-of conditions that a single global subquery cannot express.",
		exercises: [
			exercise(
				"corr-above-artist-average",
				"Above their artist's average",
				"Return albums priced above the average for their own artist. Show **title** and **price**, highest price first.",
				"The inner AVG must use the outer album's artist_id.",
				"SELECT outer_album.title, outer_album.price FROM albums AS outer_album WHERE outer_album.price > (SELECT AVG(inner_album.price) FROM albums AS inner_album WHERE inner_album.artist_id = outer_album.artist_id) ORDER BY outer_album.price DESC, outer_album.title",
				true,
			),
			exercise(
				"corr-longest-track",
				"Longest on each album",
				"Return every track tied for longest on its album. Show **title** and **duration_seconds**, longest first.",
				"Compare each track to MAX(duration_seconds) for that track's album_id.",
				"SELECT outer_track.title, outer_track.duration_seconds FROM tracks AS outer_track WHERE outer_track.duration_seconds = (SELECT MAX(inner_track.duration_seconds) FROM tracks AS inner_track WHERE inner_track.album_id = outer_track.album_id) ORDER BY outer_track.duration_seconds DESC, outer_track.title",
				true,
			),
			exercise(
				"corr-no-albums",
				"Prove no matching row exists",
				"Using NOT EXISTS, return the **name** of every artist with no albums.",
				"The nested query should look for an album whose artist_id matches the outer artist.",
				"SELECT artists.name FROM artists WHERE NOT EXISTS (SELECT 1 FROM albums WHERE albums.artist_id = artists.id)",
			),
			exercise(
				"corr-every-world-album",
				"Bought the whole World shelf",
				"Return the **name** of each customer who bought every album in the World genre.",
				"Look for a World album for which no matching purchase exists, then reject customers where such an album exists.",
				"SELECT customers.name FROM customers WHERE NOT EXISTS (SELECT 1 FROM albums WHERE albums.genre = 'World' AND NOT EXISTS (SELECT 1 FROM purchases WHERE purchases.customer_id = customers.id AND purchases.album_id = albums.id))",
			),
		],
	},
];

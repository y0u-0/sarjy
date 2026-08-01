import { exercise } from "./lesson-authoring";
import type { Lesson } from "./types";

export const windowLessons: Lesson[] = [
	{
		id: "window-ranking",
		title: "Window Ranking",
		summary: "Rank rows globally or within a group without collapsing them.",
		concept:
			"Window functions keep every row while calculating across related rows. ORDER BY inside OVER defines rank order, PARTITION BY restarts it per group, and an outer query can keep the top N from each partition.",
		exercises: [
			exercise(
				"window-global-price-rank",
				"Price rank",
				"Show every album's **title**, **price**, and price rank as **price_rank**. Highest price is rank 1. Sort by rank then title.",
				"Use RANK() OVER (ORDER BY price DESC).",
				"SELECT title, price, RANK() OVER (ORDER BY price DESC) AS price_rank FROM albums ORDER BY price_rank, title",
				true,
			),
			exercise(
				"window-album-track-rank",
				"Track rank inside each album",
				"For each track, return **album_id**, **title**, and duration rank within its album as **duration_rank**. Longest is 1. Sort by album_id and rank.",
				"PARTITION BY album_id makes the ranking restart for each album.",
				"SELECT album_id, title, RANK() OVER (PARTITION BY album_id ORDER BY duration_seconds DESC) AS duration_rank FROM tracks ORDER BY album_id, duration_rank, title",
				true,
			),
			exercise(
				"window-top-two-per-artist",
				"Top two per artist",
				"Return the two most expensive albums per artist when available. Show **artist_id**, **title**, **price**, ordered by artist and price descending.",
				"Assign ROW_NUMBER within each artist in a CTE, then keep row numbers 1 and 2.",
				"WITH ranked AS (SELECT artist_id, title, price, ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY price DESC, id) AS position FROM albums) SELECT artist_id, title, price FROM ranked WHERE position <= 2 ORDER BY artist_id, price DESC, title",
				true,
			),
			exercise(
				"window-customer-spend-rank",
				"Rank the buyers",
				"Calculate customer spend, then return **name**, **spend**, and dense rank as **spend_rank**. Round spend to 2 decimals and sort by rank then name.",
				"Aggregate spend in a CTE before applying DENSE_RANK to the totals.",
				"WITH spending AS (SELECT customers.name, ROUND(SUM(albums.price * purchases.quantity), 2) AS spend FROM purchases JOIN customers ON customers.id = purchases.customer_id JOIN albums ON albums.id = purchases.album_id GROUP BY customers.id, customers.name) SELECT name, spend, DENSE_RANK() OVER (ORDER BY spend DESC) AS spend_rank FROM spending ORDER BY spend_rank, name",
				true,
			),
		],
	},
	{
		id: "window-analytics",
		title: "Window Analytics",
		summary: "Compute running totals, comparisons, and changes across rows.",
		concept:
			"Analytic windows can look backward, forward, or across a moving frame without grouping rows away. Use SUM for cumulative values, LAG and LEAD for neighbors, AVG for peer baselines, and ROWS frames for rolling metrics.",
		exercises: [
			exercise(
				"window-running-units",
				"Running unit total",
				"Show each purchase **id**, **purchase_date**, **quantity**, and cumulative quantity as **running_units** in date and id order.",
				"SUM(quantity) OVER with an ordered ROWS frame creates the cumulative total.",
				"SELECT id, purchase_date, quantity, SUM(quantity) OVER (ORDER BY purchase_date, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_units FROM purchases ORDER BY purchase_date, id",
				true,
			),
			exercise(
				"window-previous-purchase",
				"Previous purchase date",
				"For each purchase, show **customer_id**, **purchase_date**, and that customer's prior purchase date as **previous_purchase**. Sort by customer and date.",
				"LAG(purchase_date) partitioned by customer_id returns the previous row in that customer's timeline.",
				"SELECT customer_id, purchase_date, LAG(purchase_date) OVER (PARTITION BY customer_id ORDER BY purchase_date, id) AS previous_purchase FROM purchases ORDER BY customer_id, purchase_date, id",
				true,
			),
			exercise(
				"window-vs-album-average",
				"Above or below the album",
				"Show each track's **title** and seconds above or below its album average as **seconds_from_average**, rounded to 1 decimal. Sort by title.",
				"Subtract AVG(duration_seconds) OVER (PARTITION BY album_id) from the row's duration.",
				"SELECT title, ROUND(duration_seconds - AVG(duration_seconds) OVER (PARTITION BY album_id), 1) AS seconds_from_average FROM tracks ORDER BY title",
				true,
			),
			exercise(
				"window-rolling-three",
				"Rolling three-purchase volume",
				"Show each purchase **id**, **purchase_date**, and quantity across it and the two previous purchases as **rolling_units**. Use date and id order.",
				"Use ROWS BETWEEN 2 PRECEDING AND CURRENT ROW.",
				"SELECT id, purchase_date, SUM(quantity) OVER (ORDER BY purchase_date, id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_units FROM purchases ORDER BY purchase_date, id",
				true,
			),
		],
	},
];

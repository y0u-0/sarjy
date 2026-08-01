import { exercise } from "./lesson-authoring";
import type { Lesson } from "./types";

export const analysisLessons: Lesson[] = [
	{
		id: "date-text-analysis",
		title: "Date & Text Analysis",
		summary: "Extract, reshape, and compare values stored as text and dates.",
		concept:
			"SQLite provides strftime and julianday for dates, plus substr, instr, length, replace, upper, and lower for text. Convert deliberately when a text fragment needs numeric arithmetic.",
		exercises: [
			exercise(
				"date-monthly-purchases",
				"Purchases by month",
				"Return each purchase month as **month** in `YYYY-MM` form and its count as **purchase_count**, earliest first.",
				"strftime('%Y-%m', purchase_date) creates the month key used in SELECT, GROUP BY, and ORDER BY.",
				"SELECT strftime('%Y-%m', purchase_date) AS month, COUNT(*) AS purchase_count FROM purchases GROUP BY month ORDER BY month",
				true,
			),
			exercise(
				"date-days-to-purchase",
				"Days from joining to buying",
				"For every purchase, show customer **name**, **purchase_date**, and whole days since joining as **days_after_joining**. Sort by name and purchase date.",
				"Subtract julianday(joined_date) from julianday(purchase_date), then CAST to INTEGER.",
				"SELECT customers.name, purchases.purchase_date, CAST(julianday(purchases.purchase_date) - julianday(customers.joined_date) AS INTEGER) AS days_after_joining FROM purchases JOIN customers ON customers.id = purchases.customer_id ORDER BY customers.name, purchases.purchase_date",
				true,
			),
			exercise(
				"text-email-usernames",
				"Email usernames",
				"Show every customer **name** and the part of their email before `@` as **username**, alphabetically by name.",
				"instr(email, '@') finds the separator. substr starts at 1 and stops one character before it.",
				"SELECT name, substr(email, 1, instr(email, '@') - 1) AS username FROM customers ORDER BY name",
				true,
			),
			exercise(
				"date-purchase-quarter",
				"Quarterly volume",
				"Return purchase **year**, quarter number as **quarter**, and total **units** for each quarter. Sort chronologically.",
				"Convert the month to an integer, subtract 1, divide by 3, then add 1.",
				"SELECT CAST(strftime('%Y', purchase_date) AS INTEGER) AS year, ((CAST(strftime('%m', purchase_date) AS INTEGER) - 1) / 3) + 1 AS quarter, SUM(quantity) AS units FROM purchases GROUP BY year, quarter ORDER BY year, quarter",
				true,
			),
		],
	},
	{
		id: "business-analytics",
		title: "Business Analytics",
		summary: "Combine SQL techniques into decision-ready reports.",
		concept:
			"Analytics questions rarely announce the needed construct. Build the grain first, aggregate the right measure, use windows for shares and changes, and rank only after the underlying metric is correct.",
		exercises: [
			exercise(
				"biz-customer-value",
				"Customer lifetime value",
				"Return every purchasing customer's **name**, total copies as **units**, and spend as **spend** rounded to 2 decimals. Sort by spend descending, then name.",
				"Join purchases to both customers and albums, then aggregate at customer grain.",
				"SELECT customers.name, SUM(purchases.quantity) AS units, ROUND(SUM(albums.price * purchases.quantity), 2) AS spend FROM purchases JOIN customers ON customers.id = purchases.customer_id JOIN albums ON albums.id = purchases.album_id GROUP BY customers.id, customers.name ORDER BY spend DESC, customers.name",
				true,
			),
			exercise(
				"biz-genre-share",
				"Share of revenue",
				"For every purchased genre, return **genre**, **revenue**, and percentage of all revenue as **revenue_pct**, both rounded to 2 decimals. Sort largest share first.",
				"Aggregate revenue by genre in a CTE, then divide each row by SUM(revenue) OVER ().",
				"WITH genre_revenue AS (SELECT albums.genre, SUM(albums.price * purchases.quantity) AS revenue FROM purchases JOIN albums ON albums.id = purchases.album_id GROUP BY albums.genre) SELECT genre, ROUND(revenue, 2) AS revenue, ROUND(100.0 * revenue / SUM(revenue) OVER (), 2) AS revenue_pct FROM genre_revenue ORDER BY revenue_pct DESC, genre",
				true,
			),
			exercise(
				"biz-year-over-year",
				"Year-over-year revenue change",
				"Return each purchase **year**, rounded **revenue**, and change from the prior year as **revenue_change**. The first year may be NULL. Sort by year.",
				"Aggregate yearly revenue in a CTE, then subtract LAG(revenue) over year order.",
				"WITH yearly AS (SELECT CAST(strftime('%Y', purchases.purchase_date) AS INTEGER) AS year, SUM(albums.price * purchases.quantity) AS revenue FROM purchases JOIN albums ON albums.id = purchases.album_id GROUP BY year) SELECT year, ROUND(revenue, 2) AS revenue, ROUND(revenue - LAG(revenue) OVER (ORDER BY year), 2) AS revenue_change FROM yearly ORDER BY year",
				true,
			),
			exercise(
				"biz-top-album-per-genre",
				"The revenue leader in each genre",
				"Return the highest-revenue purchased album in each genre. Show **genre**, **title**, and **revenue**, keeping ties. Sort by genre and title.",
				"Aggregate album revenue, rank inside each genre, then keep rank 1.",
				"WITH album_revenue AS (SELECT albums.id, albums.genre, albums.title, ROUND(SUM(albums.price * purchases.quantity), 2) AS revenue FROM purchases JOIN albums ON albums.id = purchases.album_id GROUP BY albums.id, albums.genre, albums.title), ranked AS (SELECT genre, title, revenue, RANK() OVER (PARTITION BY genre ORDER BY revenue DESC) AS position FROM album_revenue) SELECT genre, title, revenue FROM ranked WHERE position = 1 ORDER BY genre, title",
				true,
			),
		],
	},
];

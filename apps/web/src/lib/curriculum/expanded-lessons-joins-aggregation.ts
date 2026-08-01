import { exercise } from "./lesson-authoring";
import type { Lesson } from "./types";

export const joinsAndAggregationLessons: Lesson[] = [
	{
		id: "self-joins",
		title: "Self Joins",
		summary: "Compare rows to other rows in the same table.",
		concept:
			"A self join gives the same table two aliases so one row can be compared with another. A strict id or sequence condition prevents a row matching itself and prevents mirrored duplicates.",
		exercises: [
			exercise(
				"self-album-pairs",
				"Albums by the same artist",
				"List every pair of albums by the same artist. Return the earlier id's title as **album_one** and the later id's title as **album_two**, ordered by both titles.",
				"Join albums a to albums b on artist_id, then require a.id < b.id.",
				"SELECT a.title AS album_one, b.title AS album_two FROM albums AS a JOIN albums AS b ON a.artist_id = b.artist_id AND a.id < b.id ORDER BY album_one, album_two",
				true,
			),
			exercise(
				"self-country-peers",
				"Artists from the same country",
				"Find pairs of different artists from the same country. Return **country**, the lower id's name as **artist_one**, and the higher id's name as **artist_two**.",
				"Use two artist aliases and a.id < b.id to produce each pair once.",
				"SELECT a.country, a.name AS artist_one, b.name AS artist_two FROM artists AS a JOIN artists AS b ON a.country = b.country AND a.id < b.id",
			),
			exercise(
				"self-city-peers",
				"Customers in the same city",
				"Return each pair of customers who live in the same city. Show **city**, the lower id's name as **customer_one**, and the higher id's name as **customer_two**.",
				"The pairing pattern is the same as other self joins: equal city, different rows, one direction.",
				"SELECT a.city, a.name AS customer_one, b.name AS customer_two FROM customers AS a JOIN customers AS b ON a.city = b.city AND a.id < b.id",
			),
			exercise(
				"self-consecutive-tracks",
				"What plays next",
				"For every track that has a next track on the same album, return its **title** as **current_track** and the next title as **next_track**. Sort by album id and track number.",
				"Match one track to another with the same album_id and a track_number exactly one larger.",
				"SELECT current.title AS current_track, following.title AS next_track FROM tracks AS current JOIN tracks AS following ON following.album_id = current.album_id AND following.track_number = current.track_number + 1 ORDER BY current.album_id, current.track_number",
				true,
			),
		],
	},
	{
		id: "advanced-aggregation",
		title: "Advanced Aggregation",
		summary: "Build conditional metrics, ratios, and richer grouped reports.",
		concept:
			"Real reports often calculate several metrics in one pass. Put CASE or FILTER inside aggregates, divide by a decimal value for ratios, and keep row filters separate from group filters.",
		exercises: [
			exercise(
				"agg-filtered-counts",
				"Old and new catalog counts",
				"Return one row with albums released before 2010 as **older_albums** and albums released in 2010 or later as **newer_albums**.",
				"Use two COUNT(*) FILTER (WHERE ...) expressions.",
				"SELECT COUNT(*) FILTER (WHERE release_year < 2010) AS older_albums, COUNT(*) FILTER (WHERE release_year >= 2010) AS newer_albums FROM albums",
			),
			exercise(
				"agg-conditional-units",
				"Units by period",
				"Return total purchase quantity before 2023 as **units_before_2023** and during 2023 or later as **units_since_2023**.",
				"Use SUM(CASE WHEN condition THEN quantity ELSE 0 END) twice.",
				"SELECT SUM(CASE WHEN purchase_date < '2023-01-01' THEN quantity ELSE 0 END) AS units_before_2023, SUM(CASE WHEN purchase_date >= '2023-01-01' THEN quantity ELSE 0 END) AS units_since_2023 FROM purchases",
			),
			exercise(
				"agg-genre-revenue",
				"Revenue by genre",
				"For each purchased genre, show **genre** and revenue as **revenue**, rounded to 2 decimals. Sort from highest revenue to lowest, then by genre.",
				"Join purchases to albums, then SUM price times quantity per genre.",
				"SELECT albums.genre, ROUND(SUM(albums.price * purchases.quantity), 2) AS revenue FROM purchases JOIN albums ON albums.id = purchases.album_id GROUP BY albums.genre ORDER BY revenue DESC, albums.genre",
				true,
			),
			exercise(
				"agg-price-spread",
				"Genres with a real price spread",
				"For each genre with at least two albums, return **genre** and max price minus min price as **price_spread**, rounded to 2 decimals. Sort widest first.",
				"Group by genre, filter groups with HAVING, and subtract MIN(price) from MAX(price).",
				"SELECT genre, ROUND(MAX(price) - MIN(price), 2) AS price_spread FROM albums GROUP BY genre HAVING COUNT(*) >= 2 ORDER BY price_spread DESC, genre",
				true,
			),
		],
	},
];

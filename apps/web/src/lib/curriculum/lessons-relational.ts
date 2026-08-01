import type { Lesson } from "./types";

export const relationalLessons: Lesson[] = [
	{
		id: "aggregates",
		title: "Aggregates & Grouping",
		summary: "Summarize many rows into counts, sums, and averages.",
		concept:
			"Aggregate functions collapse rows: COUNT, SUM, AVG, MIN, MAX. GROUP BY computes them per group, and HAVING filters groups after aggregation. Use AS to give the result column a clear name.",
		exercises: [
			{
				id: "count",
				title: "Counting rows",
				prompt:
					"How many tracks does the shop have? Name the result column **track_count**.",
				hint: "COUNT(*) counts rows; AS track_count names the column.",
				referenceSql: "SELECT COUNT(*) AS track_count FROM tracks",
				ordered: false,
			},
			{
				id: "avg",
				title: "Averages",
				prompt:
					"What is the average album price, rounded to 2 decimals? Name the column **avg_price**.",
				hint: "Wrap AVG(price) in ROUND(..., 2).",
				referenceSql: "SELECT ROUND(AVG(price), 2) AS avg_price FROM albums",
				ordered: false,
			},
			{
				id: "group-by",
				title: "Grouping",
				prompt:
					"Count the albums in each genre. Return **genre** and the count as **album_count**.",
				hint: "GROUP BY genre, then COUNT(*) runs once per genre.",
				referenceSql:
					"SELECT genre, COUNT(*) AS album_count FROM albums GROUP BY genre",
				ordered: false,
			},
			{
				id: "having",
				title: "Filtering groups",
				prompt:
					"Which genres have more than one album? Return **genre** and **album_count**, only for those genres.",
				hint: "WHERE filters rows; HAVING filters groups after GROUP BY.",
				referenceSql:
					"SELECT genre, COUNT(*) AS album_count FROM albums GROUP BY genre HAVING COUNT(*) > 1",
				ordered: false,
			},
		],
	},
	{
		id: "joins",
		title: "Joins",
		summary: "Combine rows from related tables.",
		concept:
			"JOIN matches rows across tables using a condition, usually a foreign key: albums.artist_id = artists.id. INNER JOIN keeps only matches; LEFT JOIN also keeps rows from the left table that have no match.",
		exercises: [
			{
				id: "inner-join",
				title: "Your first join",
				prompt:
					"List every album **title** together with its artist's **name**.",
				hint: "JOIN artists ON albums.artist_id = artists.id connects the tables.",
				referenceSql:
					"SELECT albums.title, artists.name FROM albums JOIN artists ON albums.artist_id = artists.id",
				ordered: false,
			},
			{
				id: "join-filter",
				title: "Join + filter",
				prompt:
					"Show the **title** and **track_number** of every track on the album 'Fading Lights', in track order.",
				hint: "Join tracks to albums, filter on the album title, ORDER BY track_number.",
				referenceSql:
					"SELECT tracks.title, tracks.track_number FROM tracks JOIN albums ON tracks.album_id = albums.id WHERE albums.title = 'Fading Lights' ORDER BY tracks.track_number",
				ordered: true,
			},
			{
				id: "multi-join",
				title: "Three tables",
				prompt:
					"Which customers bought the album 'Cairo Nights'? Return their **name**.",
				hint: "purchases links customers to albums; join through it.",
				referenceSql:
					"SELECT customers.name FROM customers JOIN purchases ON purchases.customer_id = customers.id JOIN albums ON purchases.album_id = albums.id WHERE albums.title = 'Cairo Nights'",
				ordered: false,
			},
			{
				id: "left-join",
				title: "Keeping unmatched rows",
				prompt:
					"Count each artist's albums, including artists with none. Return the artist **name** and the count as **album_count**.",
				hint: "LEFT JOIN keeps artists without albums; COUNT(albums.id) counts 0 for them.",
				referenceSql:
					"SELECT artists.name, COUNT(albums.id) AS album_count FROM artists LEFT JOIN albums ON albums.artist_id = artists.id GROUP BY artists.id",
				ordered: false,
			},
		],
	},
];

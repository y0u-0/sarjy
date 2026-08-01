import { exercise } from "./lesson-authoring";
import type { Lesson } from "./types";

export const missingAndSetsLessons: Lesson[] = [
	{
		id: "null-handling",
		title: "NULL & Missing Data",
		summary: "Find, preserve, count, and replace missing values.",
		concept:
			"NULL means a value is missing, not zero or empty text. Test it with IS NULL, preserve unmatched rows with LEFT JOIN, count a nullable column when you only want matches, and use COALESCE when the result needs a fallback.",
		exercises: [
			exercise(
				"null-find-unmatched",
				"The artist with no albums",
				"Find the artist who has no albums. Return the artist **name** and **formed_year**.",
				"LEFT JOIN albums, then keep the row whose album id is NULL.",
				"SELECT artists.name, artists.formed_year FROM artists LEFT JOIN albums ON albums.artist_id = artists.id WHERE albums.id IS NULL",
			),
			exercise(
				"null-count-matches",
				"Count the matches, not the rows",
				"Count every artist's albums, including artists with none. Return **name** and **album_count**, alphabetically by name.",
				"COUNT(*) counts the preserved artist row. Count albums.id so an unmatched row contributes zero.",
				"SELECT artists.name, COUNT(albums.id) AS album_count FROM artists LEFT JOIN albums ON albums.artist_id = artists.id GROUP BY artists.id, artists.name ORDER BY artists.name",
				true,
			),
			exercise(
				"null-coalesce",
				"A useful fallback",
				"Show every artist's **name** and latest release year as **latest_release**. Use the text `No releases` when the artist has no albums. Sort by name.",
				"Aggregate first, then wrap MAX(release_year) with COALESCE. Cast the year to text so both outcomes have one type.",
				"SELECT artists.name, COALESCE(CAST(MAX(albums.release_year) AS TEXT), 'No releases') AS latest_release FROM artists LEFT JOIN albums ON albums.artist_id = artists.id GROUP BY artists.id, artists.name ORDER BY artists.name",
				true,
			),
			exercise(
				"null-nullif",
				"Turn a value into NULL",
				"Count the purchases whose quantity is not 1. Name the result **bulk_orders**.",
				"NULLIF(quantity, 1) becomes NULL for single-copy purchases. COUNT(expression) ignores NULL.",
				"SELECT COUNT(NULLIF(quantity, 1)) AS bulk_orders FROM purchases",
			),
		],
	},
	{
		id: "set-operations",
		title: "Set Operations",
		summary: "Stack, intersect, and subtract compatible result sets.",
		concept:
			"UNION combines compatible results and removes duplicates. UNION ALL keeps them. INTERSECT keeps values found on both sides, while EXCEPT keeps values found only on the left. Each SELECT must return the same number of columns.",
		exercises: [
			exercise(
				"sets-union-locations",
				"One location directory",
				"Build one alphabetical list of every artist **country** and every customer **city**. Name the column **location** and remove duplicates.",
				"Give the first SELECT the alias location, combine the two SELECTs with UNION, then sort the compound result.",
				"SELECT country AS location FROM artists UNION SELECT city FROM customers ORDER BY location",
				true,
			),
			exercise(
				"sets-union-all-years",
				"Keep every occurrence",
				"Return one column named **year** containing every artist formation year followed by every album release year. Keep duplicates.",
				"UNION removes repeats. This question asks for UNION ALL.",
				"SELECT formed_year AS year FROM artists UNION ALL SELECT release_year FROM albums",
			),
			exercise(
				"sets-intersect-years",
				"Years shared by both lists",
				"List the **year** values that appear both as an artist formation year and as an album release year, earliest first.",
				"INTERSECT keeps only values present in both SELECT results.",
				"SELECT formed_year AS year FROM artists INTERSECT SELECT release_year FROM albums ORDER BY year",
				true,
			),
			exercise(
				"sets-except-artists",
				"Artists missing from the catalog",
				"Without using a JOIN or subquery, return the **id** of every artist who has no album.",
				"Start with every artist id, then EXCEPT the artist ids that occur in albums.",
				"SELECT id FROM artists EXCEPT SELECT artist_id FROM albums",
			),
		],
	},
];

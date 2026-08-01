import type { RewriteChallenge } from "./rewrite-types";

export const CORE_REWRITE_CHALLENGES: RewriteChallenge[] = [
	{
		id: "anti-join",
		title: "The 1750× subquery",
		family: "correlated-subquery",
		slowSql:
			"SELECT al.id\nFROM albums al\nWHERE NOT EXISTS (\n  SELECT 1 FROM purchases p\n  WHERE p.album_id = al.id AND p.purchase_date = '2018-01-01'\n)",
		prompt:
			"This finds albums with no purchase on one particular day. It takes over 17 seconds. Nothing is wrong with the indexes — the shape of the query is the problem. What does SQLite have to do for every single album?",
		nudges: [
			"How many times does that inner query run? Once per album — and there are 10,000 albums.",
			"Each of those runs scans all 80,000 purchases. Could you scan purchases once instead, up front?",
			"Collect the matching album_ids in one pass, then check membership against that set.",
		],
		solutionSql:
			"SELECT al.id\nFROM albums al\nLEFT JOIN (\n  SELECT DISTINCT album_id FROM purchases\n  WHERE purchase_date = '2018-01-01'\n) p ON p.album_id = al.id\nWHERE p.album_id IS NULL",
		explanation:
			"The correlated form re-scans all 80,000 purchases once per album — 10,000 full scans. The rewrite scans purchases once into a set, then probes it. Same answer, one pass instead of ten thousand.",
		measuredSpeedup: 1690,
		caveat:
			"NOT IN is even shorter here, but only works because these columns are NOT NULL: a single NULL in the subquery makes NOT IN return no rows at all. LEFT JOIN ... IS NULL is the NULL-safe form, which is why it is the answer.",
	},
	{
		id: "correlated-aggregate",
		title: "Counting inside a filter",
		family: "correlated-subquery",
		slowSql:
			"SELECT ar.name\nFROM artists ar\nWHERE (\n  SELECT COUNT(*) FROM albums al\n  WHERE al.artist_id = ar.id AND al.genre = 'Rock'\n) >= 2",
		prompt:
			"Artists with at least two Rock albums. The subquery counts, which means it can never stop early. Where does the work actually go?",
		nudges: [
			"An aggregate cannot short-circuit — every one of those inner scans runs to completion.",
			"1,000 artists × a full 10,000-row scan each is ten million row visits.",
			"Group the albums by artist ONCE, then join to that. GROUP BY plus HAVING does the same job.",
		],
		solutionSql:
			"SELECT ar.name\nFROM artists ar\nJOIN (\n  SELECT artist_id, COUNT(*) AS n FROM albums\n  WHERE genre = 'Rock'\n  GROUP BY artist_id\n) g ON g.artist_id = ar.id\nWHERE g.n >= 2",
		explanation:
			"One grouping pass over albums replaces a thousand full scans. The grouped result is small, so the join costs almost nothing.",
		measuredSpeedup: 216,
	},
	{
		id: "count-vs-exists",
		title: "Counting when you only need to know 'any?'",
		family: "short-circuit",
		slowSql: "SELECT COUNT(*) > 0 FROM purchases WHERE quantity = 3",
		prompt:
			"This asks 'is there at least one purchase of quantity 3?' but phrases it as a count. Why does that matter?",
		nudges: [
			"To return a count, how many rows must SQLite look at?",
			"You do not need the number. You need to know whether one exists.",
			"EXISTS is allowed to stop at the first row it finds.",
		],
		solutionSql: "SELECT EXISTS (SELECT 1 FROM purchases WHERE quantity = 3)",
		explanation:
			"COUNT(*) has to visit all 80,000 rows to produce a number. EXISTS stops at the first match — here, almost immediately.",
		measuredSpeedup: 52,
		caveat:
			"This is a short-circuit lesson, not a 'COUNT is slow' lesson. When NOTHING matches, both forms scan the whole table and run identically — measure it and see.",
	},
	{
		id: "count-star",
		title: "COUNT(*) versus COUNT(column)",
		family: "aggregation",
		slowSql: "SELECT COUNT(id) FROM purchases",
		prompt:
			"Counting rows in a table. These two forms look interchangeable, and the query plans are literally identical. One is about a hundred times faster. Why?",
		nudges: [
			"Look at what each one has to read. COUNT(id) needs the value of id for every row.",
			"COUNT(*) does not need any column value at all — it only needs to know a row is there.",
			"With no WHERE clause, SQLite can answer COUNT(*) from the b-tree structure itself.",
		],
		solutionSql: "SELECT COUNT(*) FROM purchases",
		explanation:
			"A bare COUNT(*) with no WHERE compiles to a single Count opcode that reads page headers. COUNT(id) steps every row and decodes a column. Add a WHERE clause and the special case disappears — the win drops to about 2×.",
		measuredSpeedup: 61,
		caveat:
			"They are not always the same answer: COUNT(column) skips NULLs, COUNT(*) counts rows. Identical here only because id is NOT NULL.",
	},
	{
		id: "correlated-in-select",
		title: "A subquery per output row",
		family: "correlated-subquery",
		slowSql:
			"SELECT ar.name,\n  (SELECT COUNT(*) FROM albums al WHERE al.artist_id = ar.id) AS n\nFROM artists ar",
		prompt:
			"Album count per artist. The subquery sits in the SELECT list, so it runs for every row of the output. What is the total work?",
		nudges: [
			"1,000 output rows, each triggering a full scan of 10,000 albums.",
			"Every one of those scans computes a count for a different artist — but they all read the same table.",
			"Compute all the counts in one grouping pass, then attach them with a LEFT JOIN.",
		],
		solutionSql:
			"SELECT ar.name, COALESCE(g.n, 0) AS n\nFROM artists ar\nLEFT JOIN (\n  SELECT artist_id, COUNT(*) AS n FROM albums GROUP BY artist_id\n) g ON g.artist_id = ar.id",
		explanation:
			"One pass to build the counts, then a cheap join. The correlated version does the same work a thousand times over.",
		measuredSpeedup: 91,
		caveat:
			"COALESCE is required for an identical answer: a correlated COUNT gives 0 for an artist with no albums, but a LEFT JOIN gives NULL.",
	},
	{
		id: "deep-offset",
		title: "Paging by OFFSET",
		family: "pagination",
		slowSql: "SELECT id, title FROM tracks ORDER BY id LIMIT 20 OFFSET 50000",
		prompt:
			"Page 2,500 of a list. OFFSET 50000 looks like it skips ahead cheaply. Does it?",
		nudges: [
			"How does SQLite know where row 50,001 is? It has to get there somehow.",
			"OFFSET visits every one of those 50,000 rows and discards them.",
			"You are ordering by id, and you know where you left off. Ask for ids past that point instead.",
		],
		solutionSql:
			"SELECT id, title FROM tracks WHERE id > 50000 ORDER BY id LIMIT 20",
		explanation:
			"OFFSET reads and throws away 50,000 rows. A keyset predicate seeks straight into the b-tree and reads 20. This is why infinite scroll uses 'after this id', not 'skip N'.",
		measuredSpeedup: 8.2,
	},
	{
		id: "sargable-date",
		title: "Wrapping the column in a function",
		family: "sargable",
		slowSql:
			"SELECT id FROM purchases\nWHERE strftime('%Y', purchase_date) = '2020'",
		prompt:
			"All purchases from 2020. This calls a function on the column for every row. Rewrite it so the column is left alone.",
		nudges: [
			"strftime runs 80,000 times here — once per row.",
			"A date stored as YYYY-MM-DD sorts the same way it reads. Can you express 'in 2020' as a range?",
			"Everything from '2020-01-01' up to, but not including, '2021-01-01'.",
		],
		solutionSql:
			"SELECT id FROM purchases\nWHERE purchase_date >= '2020-01-01' AND purchase_date < '2021-01-01'",
		explanation:
			"You stop paying for 80,000 function calls. The bigger payoff comes later: once the column is indexed, a bare column comparison can seek, while a function-wrapped one still cannot. This is what 'sargable' means.",
		measuredSpeedup: 1.6,
		caveat:
			"Unindexed the win is modest — under 2× — because you are only saving 80,000 function calls. Add an index on purchase_date and it becomes roughly 30×, because only the range form can turn into a SEARCH. That second half is the real lesson.",
	},
];

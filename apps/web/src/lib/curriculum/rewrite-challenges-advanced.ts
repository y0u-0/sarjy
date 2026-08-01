import type { RewriteChallenge } from "./rewrite-types";

export const ADVANCED_REWRITE_CHALLENGES: RewriteChallenge[] = [
	{
		id: "sargable-arithmetic",
		title: "Arithmetic on the indexed column",
		family: "sargable",
		slowSql: "SELECT id FROM purchases WHERE quantity + 0 = 3",
		prompt:
			"There is an index on quantity, but this query still scans every purchase. The + 0 changes no value. Why does moving it away from the column change the plan?",
		nudges: [
			"The index stores quantity itself, not the result of quantity + 0.",
			"SQLite would have to calculate the expression before it could compare each row.",
			"Leave quantity bare on the left side of the comparison.",
		],
		solutionSql: "SELECT id FROM purchases WHERE quantity = 3",
		explanation:
			"An index can search stored quantity values directly. Wrapping the column in arithmetic forces SQLite to calculate a new value row by row, so the searchable predicate becomes a scan.",
		measuredSpeedup: 1.5,
		caveat:
			"The + 0 is deliberately harmless so only the access path changes. Real examples are often price * 1.2 > 20 or score / 100 >= 0.8; move the arithmetic to the constant side when the algebra allows it.",
	},
	{
		id: "sargable-cast",
		title: "Casting away a primary-key seek",
		family: "sargable",
		slowSql: "SELECT id FROM purchases WHERE CAST(id AS TEXT) = '50000'",
		prompt:
			"This asks for one primary-key row, yet it walks all 80,000. The quoted value is not the problem — SQLite can compare a numeric string to an integer key. What disabled the seek?",
		nudges: [
			"The primary-key b-tree is ordered by integer id values.",
			"CAST(id AS TEXT) asks SQLite to manufacture a different value for every row.",
			"Compare the stored id directly to the numeric value 50000.",
		],
		solutionSql: "SELECT id FROM purchases WHERE id = 50000",
		explanation:
			"The cast is on the indexed column, so the stored integer ordering cannot answer the predicate. Comparing the bare primary key lets SQLite jump directly to one row.",
		measuredSpeedup: 100,
		caveat:
			"SQLite's type affinity means id = '50000' still uses the primary key here. The useful rule is not 'quotes kill indexes'; it is 'do not transform the indexed column unless you built an expression index for that exact transform'.",
	},
	{
		id: "order-without-limit",
		title: "Sorting rows you will not read",
		family: "projection",
		slowSql: "SELECT id, title FROM tracks ORDER BY duration_seconds DESC",
		prompt:
			"You want the longest tracks, and you are going to look at the first ten. This sorts all 60,000. Add what is missing.",
		nudges: [
			"How many of these 60,000 rows will actually be used?",
			"Telling SQLite you only want ten lets the sorter behave completely differently.",
			"It can keep a running top-ten instead of ordering everything.",
		],
		solutionSql:
			"SELECT id, title FROM tracks ORDER BY duration_seconds DESC LIMIT 10",
		explanation:
			"With a LIMIT the sorter keeps a bounded top-N heap instead of sorting 60,000 rows. About 3× of the win is the sort itself; the rest is not shipping 60,000 rows you were going to ignore.",
		measuredSpeedup: 29,
		changesResults: true,
	},
	{
		id: "in-vs-join",
		title: "When IN beats a join",
		family: "set-operation",
		slowSql:
			"SELECT p.id\nFROM purchases p\nJOIN albums al ON al.id = p.album_id\nWHERE al.genre = 'Rock'",
		prompt:
			"Purchases of Rock albums. This is the textbook join, and it is the slower option here. The advice 'rewrite IN as a join' is worth testing rather than believing.",
		nudges: [
			"The join does one primary-key lookup per purchase. How many is that?",
			"The set of Rock album ids is small and does not change while the query runs.",
			"Build that set once, then test membership.",
		],
		solutionSql:
			"SELECT p.id\nFROM purchases p\nWHERE p.album_id IN (SELECT id FROM albums WHERE genre = 'Rock')",
		explanation:
			"The join performs 80,000 separate b-tree descents. IN evaluates the subquery once into a sorted list with a Bloom filter, then probes it 80,000 times — much cheaper per probe.",
		measuredSpeedup: 1.76,
		caveat:
			"Note this inverts the usual advice. EXISTS and JOIN measured identically here (within noise); only IN was faster. Which shape wins depends on the data, so measure instead of trusting a rule.",
	},
	{
		id: "aggregate-before-join",
		title: "Shrink before you join",
		family: "aggregation",
		slowSql:
			"SELECT c.city, SUM(p.quantity) AS units\nFROM purchases p\nJOIN customers c ON c.id = p.customer_id\nGROUP BY c.city",
		prompt:
			"Units sold per city. This joins 80,000 purchases to customers and then groups. Could the grouping happen earlier?",
		nudges: [
			"The join does a lookup for every one of the 80,000 purchases.",
			"But the answer only needs per-customer subtotals before it needs cities.",
			"Collapse purchases to one row per customer first, then join those 8,000 rows.",
		],
		solutionSql:
			"SELECT c.city, SUM(s.units) AS units\nFROM (\n  SELECT customer_id, SUM(quantity) AS units FROM purchases\n  GROUP BY customer_id\n) s\nJOIN customers c ON c.id = s.customer_id\nGROUP BY c.city",
		explanation:
			"Aggregating first turns 80,000 lookups into 8,000. Do the cheap shrinking work before the expensive matching work.",
		measuredSpeedup: 2.0,
		caveat:
			"This reverses when the join is selective. If you were filtering down to a handful of rows anyway, pre-aggregating 80,000 of them is actively slower — measured 0.69×. The deciding question is whether the filter throws most rows away.",
	},
	{
		id: "cte-reuse",
		title: "The CTE you should not inline",
		family: "set-operation",
		slowSql:
			"SELECT\n  (SELECT SUM(n) FROM (SELECT COUNT(*) AS n FROM tracks GROUP BY album_id)),\n  (SELECT MAX(n) FROM (SELECT COUNT(*) AS n FROM tracks GROUP BY album_id))",
		prompt:
			"Two summary numbers over the same per-album counts. The same expensive subquery is written out twice. Common advice says CTEs are optimizer fences and should be inlined — test that here.",
		nudges: [
			"Count how many times tracks gets scanned and grouped in this version.",
			"Both halves need exactly the same intermediate result.",
			"Name it once with WITH and refer to it twice.",
		],
		solutionSql:
			"WITH t AS (\n  SELECT album_id, COUNT(*) AS n FROM tracks GROUP BY album_id\n)\nSELECT (SELECT SUM(n) FROM t), (SELECT MAX(n) FROM t)",
		explanation:
			"SQLite materializes a CTE that is referenced more than once — the plan literally says MATERIALIZE. So the work happens once instead of twice. Here the CTE is the faster form, not the fence.",
		measuredSpeedup: 1.73,
		caveat:
			"Adding the MATERIALIZED keyword changes nothing — it is already the default for multiple references. Forcing NOT MATERIALIZED makes it slower again.",
	},
];

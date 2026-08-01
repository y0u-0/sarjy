/**
 * The free-form playground runs on the record shop the student already knows —
 * same tables, same column names as the curriculum — but seeded large enough that
 * optimization is measurable. The teaching dataset has 18 purchases; every plan
 * over it measures 0.00ms, so no index lesson can land.
 *
 * Keeping the schema identical matters: a query they wrote in a lesson can be
 * pasted straight in here, which is the whole point of a playground.
 *
 * Rows are generated arithmetically, so timings are reproducible between students
 * and Sarjy can talk about numbers that will not shift under her.
 */

export const PG_ARTISTS = 1_000;
export const PG_ALBUMS = 10_000;
export const PG_TRACKS = 60_000;
export const PG_CUSTOMERS = 8_000;
export const PG_PURCHASES = 80_000;

const COUNTRY_CASE = `CASE n % 8
    WHEN 0 THEN 'UK' WHEN 1 THEN 'USA' WHEN 2 THEN 'Egypt' WHEN 3 THEN 'Japan'
    WHEN 4 THEN 'Mexico' WHEN 5 THEN 'Canada' WHEN 6 THEN 'India' ELSE 'Norway'
  END`;

const GENRE_CASE = `CASE n % 7
    WHEN 0 THEN 'Rock' WHEN 1 THEN 'Synthpop' WHEN 2 THEN 'World' WHEN 3 THEN 'Ambient'
    WHEN 4 THEN 'Latin' WHEN 5 THEN 'Folk' ELSE 'Electronic'
  END`;

const CITY_CASE = `CASE n % 8
    WHEN 0 THEN 'Cairo' WHEN 1 THEN 'Oslo' WHEN 2 THEN 'Mexico City' WHEN 3 THEN 'London'
    WHEN 4 THEN 'Tokyo' WHEN 5 THEN 'Mumbai' WHEN 6 THEN 'Montreal' ELSE 'Riyadh'
  END`;

export const PLAYGROUND_DDL = `
CREATE TABLE artists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  formed_year INTEGER NOT NULL
);

CREATE TABLE albums (
  id INTEGER PRIMARY KEY,
  artist_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  genre TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE tracks (
  id INTEGER PRIMARY KEY,
  album_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  track_number INTEGER NOT NULL
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  joined_date TEXT NOT NULL
);

CREATE TABLE purchases (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  album_id INTEGER NOT NULL,
  purchase_date TEXT NOT NULL,
  quantity INTEGER NOT NULL
);

INSERT INTO artists (id, name, country, formed_year)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${PG_ARTISTS})
SELECT n, 'Artist ' || n, ${COUNTRY_CASE}, 1960 + (n * 7) % 62 FROM seq;

INSERT INTO albums (id, artist_id, title, release_year, genre, price)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${PG_ALBUMS})
SELECT n, (n * 13) % ${PG_ARTISTS} + 1, 'Album ' || n, 1970 + (n * 11) % 55,
  ${GENRE_CASE}, 8.0 + ((n * 17) % 1600) / 100.0
FROM seq;

INSERT INTO tracks (id, album_id, title, duration_seconds, track_number)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${PG_TRACKS})
SELECT n, (n * 7) % ${PG_ALBUMS} + 1, 'Track ' || n, 120 + (n * 23) % 300, (n % 12) + 1
FROM seq;

INSERT INTO customers (id, name, email, city, joined_date)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${PG_CUSTOMERS})
SELECT n, 'Customer ' || n, 'customer' || n || '@example.com', ${CITY_CASE},
  '20' || (18 + (n % 7)) || '-' || substr('0' || ((n % 12) + 1), -2) || '-' || substr('0' || ((n % 28) + 1), -2)
FROM seq;

INSERT INTO purchases (id, customer_id, album_id, purchase_date, quantity)
WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${PG_PURCHASES})
SELECT n, (n * 29) % ${PG_CUSTOMERS} + 1, (n * 19) % ${PG_ALBUMS} + 1,
  '20' || (18 + (n % 7)) || '-' || substr('0' || ((n % 12) + 1), -2) || '-' || substr('0' || ((n % 28) + 1), -2),
  (n % 3) + 1
FROM seq;
`;

export interface PlaygroundTable {
	name: string;
	rows: number;
	columns: string[];
}

export const PLAYGROUND_TABLES: PlaygroundTable[] = [
	{
		name: "artists",
		rows: PG_ARTISTS,
		columns: ["id", "name", "country", "formed_year"],
	},
	{
		name: "albums",
		rows: PG_ALBUMS,
		columns: ["id", "artist_id", "title", "release_year", "genre", "price"],
	},
	{
		name: "tracks",
		rows: PG_TRACKS,
		columns: ["id", "album_id", "title", "duration_seconds", "track_number"],
	},
	{
		name: "customers",
		rows: PG_CUSTOMERS,
		columns: ["id", "name", "email", "city", "joined_date"],
	},
	{
		name: "purchases",
		rows: PG_PURCHASES,
		columns: ["id", "customer_id", "album_id", "purchase_date", "quantity"],
	},
];

export const PLAYGROUND_SCHEMA_SUMMARY = PLAYGROUND_TABLES.map(
	(table) =>
		`${table.name}(${table.columns.join(", ")}) — ${table.rows.toLocaleString()} rows`,
).join("; ");

/** Starter queries that each demonstrate a different plan shape. */
export const PLAYGROUND_EXAMPLES = [
	{
		label: "Filter on a text column",
		sql: "SELECT COUNT(*) FROM albums WHERE genre = 'Rock'",
	},
	{
		label: "Sort and limit",
		sql: "SELECT title, price FROM albums ORDER BY price DESC LIMIT 10",
	},
	{
		label: "Join two tables",
		sql: "SELECT a.name, COUNT(*) AS albums\nFROM albums al\nJOIN artists a ON a.id = al.artist_id\nGROUP BY a.name\nORDER BY albums DESC\nLIMIT 10",
	},
	{
		label: "Filter plus sort",
		sql: "SELECT title, release_year\nFROM albums\nWHERE genre = 'Folk'\nORDER BY release_year DESC\nLIMIT 20",
	},
	{
		label: "Three-table join",
		sql: "SELECT c.city, SUM(p.quantity) AS units\nFROM purchases p\nJOIN customers c ON c.id = p.customer_id\nJOIN albums al ON al.id = p.album_id\nWHERE al.genre = 'Rock'\nGROUP BY c.city\nORDER BY units DESC",
	},
] as const;

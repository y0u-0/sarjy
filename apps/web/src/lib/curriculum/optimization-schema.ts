export const PLAY_ROWS = 60_000;
const LISTENER_ROWS = 5_000;
const TRACK_ROWS = 2_000;

export const LAB_DDL = `
CREATE TABLE listeners (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  plan TEXT NOT NULL
);

CREATE TABLE tracks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL
);

CREATE TABLE plays (
  id INTEGER PRIMARY KEY,
  listener_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  country TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  ms_played INTEGER NOT NULL
);

INSERT INTO listeners (id, name, country, plan)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${LISTENER_ROWS}
)
SELECT
  n,
  'Listener ' || n,
  CASE n % 6
    WHEN 0 THEN 'SA' WHEN 1 THEN 'AE' WHEN 2 THEN 'EG'
    WHEN 3 THEN 'KW' WHEN 4 THEN 'QA' ELSE 'BH'
  END,
  CASE n % 3 WHEN 0 THEN 'premium' WHEN 1 THEN 'free' ELSE 'family' END
FROM seq;

INSERT INTO tracks (id, title, genre, duration_seconds)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${TRACK_ROWS}
)
SELECT
  n,
  'Track ' || n,
  CASE n % 5
    WHEN 0 THEN 'Rock' WHEN 1 THEN 'Pop' WHEN 2 THEN 'Jazz'
    WHEN 3 THEN 'Khaleeji' ELSE 'Hip-Hop'
  END,
  120 + (n * 7) % 300
FROM seq;

INSERT INTO plays (id, listener_id, track_id, country, played_at, ms_played)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < ${PLAY_ROWS}
)
SELECT
  n,
  (n * 37) % ${LISTENER_ROWS} + 1,
  (n * 17) % ${TRACK_ROWS} + 1,
  CASE n % 6
    WHEN 0 THEN 'SA' WHEN 1 THEN 'AE' WHEN 2 THEN 'EG'
    WHEN 3 THEN 'KW' WHEN 4 THEN 'QA' ELSE 'BH'
  END,
  1700000000 + n * 41,
  5000 + (n * 13) % 295000
FROM seq;
`;

export const LAB_SCHEMA_SUMMARY = `plays(id, listener_id, track_id, country, played_at, ms_played) — ${PLAY_ROWS.toLocaleString()} rows; listeners(id, name, country, plan) — ${LISTENER_ROWS.toLocaleString()} rows; tracks(id, title, genre, duration_seconds) — ${TRACK_ROWS.toLocaleString()} rows. No indexes exist except the INTEGER PRIMARY KEY on each table.`;

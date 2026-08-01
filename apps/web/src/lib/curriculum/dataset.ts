export const SCHEMA_SUMMARY = [
	"artists(id, name, country, formed_year)",
	"albums(id, artist_id -> artists.id, title, release_year, genre, price)",
	"tracks(id, album_id -> albums.id, title, duration_seconds, track_number)",
	"customers(id, name, email, city, joined_date)",
	"purchases(id, customer_id -> customers.id, album_id -> albums.id, purchase_date, quantity)",
].join("; ");

export const RECORD_SHOP_DDL = `
BEGIN;

CREATE TABLE artists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  formed_year INTEGER NOT NULL
);

CREATE TABLE albums (
  id INTEGER PRIMARY KEY,
  artist_id INTEGER NOT NULL REFERENCES artists(id),
  title TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  genre TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE tracks (
  id INTEGER PRIMARY KEY,
  album_id INTEGER NOT NULL REFERENCES albums(id),
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
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  album_id INTEGER NOT NULL REFERENCES albums(id),
  purchase_date TEXT NOT NULL,
  quantity INTEGER NOT NULL
);

INSERT INTO artists (id, name, country, formed_year) VALUES
  (1, 'The Midnight Echoes', 'UK', 1998),
  (2, 'Velvet Skyline', 'USA', 2005),
  (3, 'Nour El Ain', 'Egypt', 2010),
  (4, 'Kaze no Oto', 'Japan', 2001),
  (5, 'Los Soles', 'Mexico', 2012),
  (6, 'Northern Pines', 'Canada', 1995),
  (7, 'Saffron Street', 'India', 2015),
  (8, 'Aurora Falls', 'Norway', 2008),
  (9, 'Echo Valley', 'USA', 2021);

INSERT INTO albums (id, artist_id, title, release_year, genre, price) VALUES
  (1, 1, 'Fading Lights', 2001, 'Rock', 12.99),
  (2, 1, 'City of Glass', 2004, 'Rock', 14.50),
  (3, 1, 'Echo Chamber', 2011, 'Alternative', 16.00),
  (4, 2, 'Neon Horizon', 2008, 'Synthpop', 13.25),
  (5, 2, 'Static Dreams', 2013, 'Synthpop', 15.75),
  (6, 3, 'Desert Bloom', 2014, 'World', 11.50),
  (7, 3, 'Cairo Nights', 2018, 'World', 17.00),
  (8, 4, 'Paper Cranes', 2006, 'Ambient', 10.99),
  (9, 4, 'Silent Garden', 2010, 'Ambient', 12.00),
  (10, 5, 'Fiesta Eterna', 2016, 'Latin', 13.99),
  (11, 6, 'Timberline', 1999, 'Folk', 9.99),
  (12, 6, 'Snowmelt', 2003, 'Folk', 11.25),
  (13, 7, 'Monsoon Market', 2019, 'Fusion', 18.50),
  (14, 8, 'Polar Glow', 2012, 'Electronic', 14.00),
  (15, 8, 'Midnight Sun', 2017, 'Electronic', 16.50);

INSERT INTO tracks (id, album_id, title, duration_seconds, track_number) VALUES
  (1, 1, 'Opening Sky', 215, 1),
  (2, 1, 'Fading Lights', 252, 2),
  (3, 1, 'Last Train Home', 198, 3),
  (4, 2, 'Glass Towers', 240, 1),
  (5, 2, 'Rooftop Rain', 187, 2),
  (6, 3, 'Echo Chamber', 305, 1),
  (7, 3, 'Reverb', 226, 2),
  (8, 4, 'Neon Drive', 233, 1),
  (9, 4, 'Horizon Line', 264, 2),
  (10, 5, 'Static', 199, 1),
  (11, 5, 'Dream Sequence', 312, 2),
  (12, 6, 'Desert Rose', 245, 1),
  (13, 6, 'Oasis', 271, 2),
  (14, 7, 'Nile at Dusk', 288, 1),
  (15, 7, 'Old City Lights', 254, 2),
  (16, 8, 'Folded Wings', 196, 1),
  (17, 8, 'Paper Cranes', 221, 2),
  (18, 9, 'Moss Stone', 243, 1),
  (19, 10, 'Baile Nocturno', 208, 1),
  (20, 10, 'Sol y Sombra', 232, 2),
  (21, 11, 'Pine Ridge', 189, 1),
  (22, 12, 'First Thaw', 205, 1),
  (23, 13, 'Spice Run', 276, 1),
  (24, 14, 'Glacier', 318, 1),
  (25, 15, 'Sun at Midnight', 295, 1);

INSERT INTO customers (id, name, email, city, joined_date) VALUES
  (1, 'Amira Hassan', 'amira@example.com', 'Cairo', '2022-03-15'),
  (2, 'Jonas Berg', 'jonas@example.com', 'Oslo', '2021-11-02'),
  (3, 'Sofia Reyes', 'sofia@example.com', 'Mexico City', '2023-01-20'),
  (4, 'Liam Carter', 'liam@example.com', 'London', '2020-07-08'),
  (5, 'Yuki Tanaka', 'yuki@example.com', 'Tokyo', '2022-09-30'),
  (6, 'Priya Sharma', 'priya@example.com', 'Mumbai', '2023-05-12'),
  (7, 'Emma Tremblay', 'emma@example.com', 'Montreal', '2021-04-25'),
  (8, 'Omar Said', 'omar@example.com', 'Cairo', '2023-08-03');

INSERT INTO purchases (id, customer_id, album_id, purchase_date, quantity) VALUES
  (1, 1, 6, '2023-02-10', 1),
  (2, 1, 7, '2023-06-21', 2),
  (3, 2, 14, '2022-01-15', 1),
  (4, 2, 15, '2023-03-09', 1),
  (5, 2, 11, '2023-07-30', 1),
  (6, 3, 10, '2023-02-14', 3),
  (7, 4, 1, '2021-05-19', 1),
  (8, 4, 2, '2021-05-19', 1),
  (9, 4, 3, '2022-10-11', 2),
  (10, 5, 8, '2022-12-25', 1),
  (11, 5, 9, '2023-04-07', 1),
  (12, 6, 13, '2023-09-18', 2),
  (13, 7, 11, '2021-08-22', 1),
  (14, 7, 12, '2022-06-14', 1),
  (15, 7, 4, '2023-11-05', 1),
  (16, 8, 7, '2023-10-29', 1),
  (17, 3, 5, '2024-01-12', 1),
  (18, 6, 6, '2024-02-23', 1);

COMMIT;
`;

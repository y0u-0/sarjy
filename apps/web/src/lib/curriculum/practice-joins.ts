import type { AuthoredExercise } from "./practice-authoring";

export const joinsPractice: Record<string, AuthoredExercise[]> = {
	joins: [
		{
			id: "pool-album-artist",
			title: "Who made what",
			prompt:
				"Show every album's **title** alongside its artist's **name**, in alphabetical order by album title.",
			hint: "The albums table stores an artist_id. Match it to the artists table.",
			referenceSql:
				"SELECT albums.title, artists.name FROM albums JOIN artists ON albums.artist_id = artists.id ORDER BY albums.title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 2,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 20,
				concepts: ["multi-table", "facing-foreign-keys", "ordering"],
			},
		},
		{
			id: "pool-track-album",
			title: "Which record is this track on",
			prompt:
				"Show each track's **title** and the title of the album it sits on as **album**, in alphabetical order by track title.",
			hint: "Both tables have a column called title, so you will need to say which one you mean.",
			referenceSql:
				"SELECT tracks.title, albums.title AS album FROM tracks JOIN albums ON tracks.album_id = albums.id ORDER BY tracks.title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 2,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 22,
				concepts: ["multi-table", "ambiguous-columns", "ordering"],
			},
		},
		{
			id: "pool-customer-purchases",
			title: "Who bought what",
			prompt:
				"Show each purchase as the customer's **name** and the album's **title**, ordered by name then title.",
			hint: "The purchases table sits between the two things you want. You will be reaching through it.",
			referenceSql:
				"SELECT customers.name, albums.title FROM purchases JOIN customers ON purchases.customer_id = customers.id JOIN albums ON purchases.album_id = albums.id ORDER BY customers.name, albums.title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 3,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 34,
				concepts: ["multi-table", "facing-foreign-keys", "ordering"],
			},
		},
		{
			id: "pool-artist-tracks",
			title: "From artist to track",
			prompt:
				"Show every artist's **name** with the **title** of each of their tracks, ordered by artist name then track title.",
			hint: "Tracks do not know about artists directly. There is a table in between.",
			referenceSql:
				"SELECT artists.name, tracks.title FROM tracks JOIN albums ON tracks.album_id = albums.id JOIN artists ON albums.artist_id = artists.id ORDER BY artists.name, tracks.title",
			ordered: true,
			variant: "surface",
			complexity: {
				tables: 3,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 34,
				concepts: ["multi-table", "facing-foreign-keys", "ordering"],
			},
		},
		{
			id: "pool-every-artist-albums",
			title: "Every artist, even the quiet ones",
			prompt:
				"Show every artist's **name** and how many albums they have as **albums**, in alphabetical order by name. Artists with nothing released yet should still appear, with zero.",
			hint: "There are nine artists. If you get eight rows, the join threw one away — which is exactly what a plain join does to rows with no match.",
			referenceSql:
				"SELECT artists.name, COUNT(albums.id) AS albums FROM artists LEFT JOIN albums ON albums.artist_id = artists.id GROUP BY artists.id, artists.name ORDER BY artists.name",
			ordered: true,
			variant: "neighbour",
			exposes: ["SEM-3:48", "LOG-2:62"],
			complexity: {
				tables: 2,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 30,
				concepts: ["multi-table", "outer-join", "grouping", "ordering"],
			},
		},
		{
			id: "pool-artists-no-albums",
			title: "Signed but silent",
			prompt: "Show the **name** of every artist who has no albums at all.",
			hint: "Keep every artist, then keep only the ones where the album side came back empty.",
			referenceSql:
				"SELECT artists.name FROM artists LEFT JOIN albums ON albums.artist_id = artists.id WHERE albums.id IS NULL",
			ordered: false,
			variant: "neighbour",
			exposes: ["SYN-6:21", "LOG-1:55"],
			complexity: {
				tables: 2,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 20,
				concepts: ["multi-table", "outer-join", "does-not-exist", "null"],
			},
		},
		{
			id: "pool-track-matching-album",
			title: "The title track",
			prompt:
				"Some albums have a track with the same name as the album itself. Show the **title** of every such track, alphabetically.",
			hint: "You are comparing two columns to each other rather than comparing a column to a value.",
			referenceSql:
				"SELECT tracks.title FROM tracks JOIN albums ON tracks.album_id = albums.id WHERE tracks.title = albums.title ORDER BY tracks.title",
			ordered: true,
			variant: "neighbour",
			complexity: {
				tables: 2,
				clauses: 4,
				nestingDepth: 0,
				solutionTokens: 24,
				concepts: ["multi-table", "column-comparison", "ordering"],
			},
		},
		{
			id: "pool-same-city-customers",
			title: "Two customers, one city",
			prompt:
				"Find pairs of customers who live in the same city. Show the two names as **name** and **other**, and list each pair only once.",
			hint: "There is only one table involved, and you need it twice. Give each copy its own name, then keep the pair in one direction only.",
			referenceSql:
				"SELECT a.name AS name, b.name AS other FROM customers a JOIN customers b ON a.city = b.city AND a.id < b.id",
			ordered: false,
			variant: "trap",
			exposes: ["SYN-1:1", "LOG-2:58", "SEM-4:49"],
			complexity: {
				tables: 2,
				clauses: 3,
				nestingDepth: 0,
				solutionTokens: 27,
				concepts: ["self-join", "correlation-names", "multi-table"],
			},
		},
	],
};

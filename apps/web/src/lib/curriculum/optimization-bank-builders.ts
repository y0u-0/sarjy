import type { OptimizationProblem as IndexSourceProblem } from "./optimization";
import {
	complexityFor,
	INDEX_CONCEPT_LABELS,
	INDEX_SUCCESS,
	REWRITE_CONCEPTS,
	REWRITE_INDEXES,
} from "./optimization-bank-rules";
import type {
	IndexOptimizationProblem,
	RewriteOptimizationProblem,
} from "./optimization-bank-types";
import type { RewriteChallenge } from "./rewrites";

export function indexProblem(
	source: IndexSourceProblem,
): IndexOptimizationProblem {
	const success = INDEX_SUCCESS[source.id];
	if (!success) throw new Error(`Missing success criterion for ${source.id}`);

	return {
		id: source.id,
		title: source.title,
		prompt: source.prompt,
		concept: source.concept,
		conceptLabel: INDEX_CONCEPT_LABELS[source.concept] ?? source.concept,
		datasetId: "lab",
		mode: "index",
		querySql: source.sql,
		goal: source.goal,
		predictHint: source.predictHint,
		illustration: source.illustration,
		solutions: source.suggestions,
		success,
		complexity: complexityFor(source.sql, [source.concept]),
	};
}

export function rewriteProblem(
	source: RewriteChallenge,
): RewriteOptimizationProblem {
	const concept = REWRITE_CONCEPTS[source.family];
	return {
		id: source.id,
		title: source.title,
		prompt: source.prompt,
		concept: concept.id,
		conceptLabel: concept.label,
		datasetId: "record-shop-large",
		mode: "rewrite",
		technique: "rewrite",
		baselineSql: source.slowSql,
		solutionSql: source.solutionSql,
		nudges: source.nudges,
		explanation: source.explanation,
		...(source.caveat ? { caveat: source.caveat } : {}),
		indexes: REWRITE_INDEXES[source.id] ?? [],
		predictHint:
			"Will your rewrite do less work, more work, or about the same?",
		success: {
			kind: "rewrite",
			minimumSpeedup: 1.15,
			allowResultChange: source.changesResults ?? false,
		},
		complexity: complexityFor(source.solutionSql, [
			...concept.concepts,
			source.family,
		]),
	};
}

export const CTAS_REUSE_PROBLEM: RewriteOptimizationProblem = {
	id: "ctas-reuse",
	title: "Build once, read twice",
	prompt:
		"This report groups all 60,000 tracks twice. Persist that expensive grouping once with CREATE TABLE AS SELECT, then answer both questions from the smaller summary.",
	concept: "optimization-materialization",
	conceptLabel: "Reusable materialization",
	datasetId: "record-shop-large",
	mode: "rewrite",
	technique: "ctas",
	baselineSql: `SELECT
  (SELECT SUM(track_count) FROM (
    SELECT COUNT(*) AS track_count FROM tracks GROUP BY album_id
  )) AS total_tracks,
  (SELECT MAX(track_count) FROM (
    SELECT COUNT(*) AS track_count FROM tracks GROUP BY album_id
  )) AS largest_album;`,
	solutionSql: `CREATE TEMP TABLE album_track_counts AS
SELECT album_id, COUNT(*) AS track_count
FROM tracks
GROUP BY album_id;

SELECT
  (SELECT SUM(track_count) FROM album_track_counts) AS total_tracks,
  (SELECT MAX(track_count) FROM album_track_counts) AS largest_album;`,
	nudges: [
		"Find the repeated unit of work: both scalar subqueries scan and group the tracks table.",
		"Use CREATE TEMP TABLE … AS SELECT to store one row per album, then query that smaller table twice.",
	],
	explanation:
		"CTAS pays for one scan and grouping pass, stores the 10,000-row summary, and lets both consumers reuse it. The benchmark includes the table creation, so the comparison does not hide the write cost.",
	caveat:
		"A materialized table can become stale and costs storage and writes. It is useful when expensive work is reused or a stable snapshot is intentional—not as an automatic replacement for every CTE or one-off query.",
	indexes: [],
	predictHint:
		"Will one grouped scan plus two small summary scans beat grouping the source twice after we include the CTAS build cost?",
	success: {
		kind: "rewrite",
		minimumSpeedup: 1.15,
		allowResultChange: false,
	},
	complexity: complexityFor(
		`CREATE TEMP TABLE album_track_counts AS
SELECT album_id, COUNT(*) AS track_count FROM tracks GROUP BY album_id;
SELECT SUM(track_count), MAX(track_count) FROM album_track_counts;`,
		["materialization", "ctas", "reuse", "aggregation"],
	),
};

/**
 * Executes every optimization baseline and authored solution against the pinned
 * SQLite WASM engine. Fails on answer drift, a baseline that already passes, or
 * a reference change that does not satisfy its measured goal.
 */
import type { OptimizationLabProblem } from "../src/lib/curriculum/optimization-bank";
import {
	optimizationDatasets,
	optimizationProblemBank,
} from "../src/lib/curriculum/optimization-bank";
import { hasDeterministicWorkImprovement } from "../src/lib/optimize/success";
import type { WorkCounters } from "../src/lib/sql-engine/types";
import {
	type Measurement,
	measure,
	measureProgram,
	timeRatio,
	withDb,
} from "./measure";

const samples = Math.max(
	1,
	Number(
		process.argv
			.find((argument) => argument.startsWith("--samples="))
			?.slice("--samples=".length) ?? 1,
	),
);
const requestedId = process.argv
	.find((argument) => argument.startsWith("--id="))
	?.slice("--id=".length);
const problems = requestedId
	? optimizationProblemBank.filter((problem) => problem.id === requestedId)
	: optimizationProblemBank;

if (requestedId && problems.length === 0) {
	throw new Error(`Unknown optimization problem: ${requestedId}`);
}

function work(measurement: Measurement): WorkCounters {
	return {
		fullScanSteps: measurement.fullScanSteps,
		vmSteps: measurement.vmSteps,
		vmStepsOverflowed: measurement.vmStepsOverflowed,
		sorts: measurement.sorts,
		autoIndexRows: measurement.autoIndexRows,
	};
}

function indexedSteps(plan: readonly string[]): number {
	return plan.filter(
		(line) =>
			/^SEARCH\b/i.test(line) || /\bUSING\s+(?:\w+\s+)*INDEX\b/i.test(line),
	).length;
}

function indexGoalPassed(
	problem: Extract<OptimizationLabProblem, { mode: "index" }>,
	measurement: Measurement,
): boolean {
	const criterion = problem.success;
	return !(
		(criterion.maxFullScanSteps !== undefined &&
			measurement.fullScanSteps > criterion.maxFullScanSteps) ||
		(criterion.maxSorts !== undefined &&
			measurement.sorts > criterion.maxSorts) ||
		(criterion.minIndexedSteps !== undefined &&
			indexedSteps(measurement.plan) < criterion.minIndexedSteps) ||
		(criterion.requireCoveringIndex &&
			!measurement.plan.some((line) => /\bCOVERING INDEX\b/i.test(line)))
	);
}

function printMeasurement(label: string, measurement: Measurement): void {
	console.log(
		`${label}: full-scan=${measurement.fullScanSteps}, vm=${measurement.vmStepsOverflowed ? "unavailable" : measurement.vmSteps}, sorts=${measurement.sorts}, automatic-index-rows=${measurement.autoIndexRows}, output=${measurement.rows}`,
	);
	for (const line of measurement.plan) console.log(`  ${line}`);
}

let failures = 0;
for (const problem of problems) {
	console.log(`\n[${problem.id}] measuring with ${samples} timing sample(s)`);
	const dataset = optimizationDatasets[problem.datasetId];
	if (problem.mode === "index") {
		const baseline = await withDb(dataset.ddl, [], (sqlite3, db) =>
			measure(sqlite3, db, problem.querySql, samples),
		);
		printMeasurement("baseline", baseline);
		if (indexGoalPassed(problem, baseline)) {
			console.error("  FAIL: baseline already satisfies the authored goal");
			failures += 1;
		}

		for (const suggestion of problem.solutions) {
			const candidate = await withDb(
				dataset.ddl,
				[suggestion.sql],
				(sqlite3, db) => measure(sqlite3, db, problem.querySql, samples),
			);
			printMeasurement(suggestion.label, candidate);
			const deliberateDecoy = /\bdecoy\b/i.test(suggestion.rationale);
			const passed = indexGoalPassed(problem, candidate);
			if (deliberateDecoy ? passed : !passed) {
				console.error(
					`  FAIL: ${deliberateDecoy ? "decoy unexpectedly passed" : "reference index missed its goal"}`,
				);
				failures += 1;
			}
		}
		continue;
	}

	const { baseline, candidate } = await withDb(
		dataset.ddl,
		problem.indexes,
		(sqlite3, db) => ({
			baseline: measure(sqlite3, db, problem.baselineSql, samples),
			candidate:
				problem.technique === "ctas"
					? measureProgram(sqlite3, db, problem.solutionSql, samples)
					: measure(sqlite3, db, problem.solutionSql, samples),
		}),
	);
	printMeasurement("baseline", baseline);
	printMeasurement("reference", candidate);

	const equivalent = baseline.digest === candidate.digest;
	if (problem.success.allowResultChange ? equivalent : !equivalent) {
		console.error(
			`  FAIL: ${problem.success.allowResultChange ? "the result was expected to change" : "reference answer differs"}`,
		);
		failures += 1;
	}
	const deterministic = hasDeterministicWorkImprovement(
		work(baseline),
		work(candidate),
	);
	const clockRatio = timeRatio(baseline, candidate);
	if (!deterministic && clockRatio < problem.success.minimumSpeedup) {
		console.error(
			`  FAIL: neither deterministic work nor the ${clockRatio.toFixed(2)}x timing meets the goal`,
		);
		failures += 1;
	}
}

if (failures > 0) {
	throw new Error(`${failures} optimization-bank verification failure(s)`);
}

console.log(
	`\nVerified ${problems.length} optimization problem(s) against SQLite.`,
);

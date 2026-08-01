/**
 * Re-measures every rewrite challenge and reports what the engine actually does.
 *
 * Run after touching a challenge or the dataset. It looks for three things: a stored
 * speedup that no longer reproduces, a "slow" form SQLite has quietly started
 * optimising, and a challenge where the work counters and the clock disagree about
 * which form is better. The third is not a failure — instructions are not uniformly
 * priced, so a query can execute more of them and finish sooner — but it must be
 * known, because presenting the step count as "speed" would be a lie.
 */
import { PLAYGROUND_DDL } from "../src/lib/curriculum/playground";
import { rewriteChallenges } from "../src/lib/curriculum/rewrites";
import { hasDeterministicWorkImprovement } from "../src/lib/optimize/success";
import type { WorkCounters } from "../src/lib/sql-engine/types";
import {
	formatRatio,
	measure,
	scanRatio,
	stepRatio,
	timeRatio,
	withDb,
} from "./measure";

/**
 * Indexes a challenge needs in order to teach anything. A sargability lesson with
 * no index on the column is not a lesson: both forms scan, and the student
 * correctly concludes the rewrite was pointless.
 */
const CHALLENGE_INDEXES: Record<string, string[]> = {
	"sargable-date": [
		"CREATE INDEX idx_purchases_date ON purchases(purchase_date)",
	],
	"sargable-arithmetic": [
		"CREATE INDEX idx_purchases_quantity ON purchases(quantity)",
	],
};

const NOT_FASTER = 1.15;

function work(measurement: {
	fullScanSteps: number;
	vmSteps: number;
	vmStepsOverflowed: boolean;
	sorts: number;
	autoIndexRows: number;
}): WorkCounters {
	return measurement;
}

const requestedId = process.argv
	.find((argument) => argument.startsWith("--id="))
	?.slice("--id=".length)
	.trim();
const sampleCount = Math.max(
	1,
	Number(
		process.argv
			.find((argument) => argument.startsWith("--samples="))
			?.slice("--samples=".length) ?? 1,
	),
);
const selectedChallenges = requestedId
	? rewriteChallenges.filter((challenge) => challenge.id === requestedId)
	: rewriteChallenges;

if (requestedId && selectedChallenges.length === 0) {
	throw new Error(`Unknown rewrite challenge: ${requestedId}`);
}

let failures = 0;
const notes: string[] = [];

console.log(
	"id".padEnd(23) +
		"scan".padStart(8) +
		"steps".padStart(8) +
		"time".padStart(8) +
		"   full-scan steps".padEnd(24) +
		"sorts   stored   flags",
);
console.log("-".repeat(122));

for (const challenge of selectedChallenges) {
	console.log(`measuring ${challenge.id} with ${sampleCount} sample(s)…`);
	const indexes = CHALLENGE_INDEXES[challenge.id] ?? [];

	const { slow, fast } = await withDb(
		PLAYGROUND_DDL,
		indexes,
		(sqlite3, db) => ({
			slow: measure(sqlite3, db, challenge.slowSql, sampleCount),
			fast: measure(sqlite3, db, challenge.solutionSql, sampleCount),
		}),
	);

	const scan = scanRatio(slow, fast);
	const steps = stepRatio(slow, fast);
	const time = timeRatio(slow, fast);
	const flags: string[] = [];

	// Stable SQLite work counters decide first; the noisy wall clock is a fallback
	// for rewrites whose counters price instructions differently.
	const deterministicWorkImproved = hasDeterministicWorkImprovement(
		work(slow),
		work(fast),
	);
	if (!deterministicWorkImproved && time < NOT_FASTER) {
		flags.push("NOT-FASTER");
		failures += 1;
	}
	if (slow.digest !== fast.digest && !challenge.changesResults) {
		flags.push("ANSWERS-DIFFER");
		failures += 1;
	}
	if (slow.digest === fast.digest && challenge.changesResults) {
		flags.push("changesResults-unneeded");
	}
	if (steps !== null && steps < 1 && time > NOT_FASTER) {
		flags.push("steps-disagree-with-clock");
		notes.push(
			`${challenge.id}: faster by the clock (${formatRatio(time)}) while doing MORE instructions (${formatRatio(steps)}). Do not headline steps here.`,
		);
	}
	if (slow.vmStepsOverflowed || fast.vmStepsOverflowed) {
		flags.push("steps-overflowed");
		notes.push(
			`${challenge.id}: vm step counter wrapped past 2^31 — the UI must withhold the number, not print a negative.`,
		);
	}

	console.log(
		challenge.id.padEnd(23) +
			formatRatio(scan).padStart(8) +
			formatRatio(steps).padStart(8) +
			formatRatio(time).padStart(8) +
			`   ${String(slow.fullScanSteps).padStart(9)} -> ${String(fast.fullScanSteps).padEnd(8)}` +
			`  ${slow.sorts}->${fast.sorts}`.padEnd(8) +
			`${challenge.measuredSpeedup}x`.padStart(7) +
			(indexes.length > 0 ? "  [idx]" : "      ") +
			`  ${flags.join(" ")}`,
	);
}

if (notes.length > 0) {
	console.log("\nNotes:");
	for (const note of notes) console.log(`  - ${note}`);
}

console.log(
	`\n${
		failures === 0
			? `All ${selectedChallenges.length} selected challenge(s) improve deterministic work or the fallback clock and preserve the intended answer.`
			: `${failures} genuine problem(s) — see NOT-FASTER / ANSWERS-DIFFER above.`
	}`,
);

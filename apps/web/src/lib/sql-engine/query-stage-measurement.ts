import { buildStageProbes } from "./query-stage-probes";
import type {
	MeasureStagesOptions,
	StageMeasurement,
	StageReport,
} from "./query-stage-types";

export function measureStages(
	sql: string,
	{ count, planLines, finalRowCount, budgetMs = 200 }: MeasureStagesOptions,
): StageReport {
	const built = buildStageProbes(sql);
	if (built.blockers.length) {
		return {
			supported: false,
			blockers: built.blockers,
			stages: [],
			notes: [],
			totalProbeMs: 0,
		};
	}

	const { scanned, searched } = classifyPlanInputs(planLines);
	const stages: StageMeasurement[] = [];
	const notes = [...built.notes];
	let spentMs = 0;
	for (const probe of built.probes) {
		if (spentMs > budgetMs) {
			notes.push(
				`Stopped measuring before "${probe.label}" to stay responsive.`,
			);
			break;
		}
		const startedAt = performance.now();
		let value: number | null = null;
		let failure: string | null = null;
		try {
			value = count(probe.sql);
		} catch (error) {
			failure = error instanceof Error ? error.message : String(error);
		}
		spentMs += performance.now() - startedAt;
		if (failure !== null || value === null) {
			notes.push(`Could not measure "${probe.label}": ${failure}`);
			continue;
		}

		const atCap = probe.capped != null && value > probe.capped;
		const stage: StageMeasurement = {
			stage: probe.stage,
			label: probe.label,
			rows: atCap ? (probe.capped as number) : value,
			atLeast: atCap,
		};
		if (probe.stage === "input" && probe.alias) {
			const alias = probe.alias.toLowerCase().replace(/^["'`[]|["'`\]]$/g, "");
			stage.fullyScanned = scanned.has(alias);
			stage.indexLookup = searched.has(alias);
			stage.kind = probe.kind;
		}
		stages.push(stage);
	}

	appendFanOutNotes(stages, notes);
	stages.push({
		stage: "final",
		label: "rows returned",
		rows: finalRowCount,
		atLeast: false,
	});
	return {
		supported: true,
		blockers: [],
		stages,
		notes,
		totalProbeMs: Number(spentMs.toFixed(1)),
	};
}

function classifyPlanInputs(planLines: string[]) {
	const scanned = new Set<string>();
	const searched = new Set<string>();
	for (const line of planLines) {
		const match = /^(SCAN|SEARCH)\s+(\S+)/i.exec(line.trim());
		if (!match) continue;
		(match[1].toUpperCase() === "SCAN" ? scanned : searched).add(
			match[2].toLowerCase(),
		);
	}
	return { scanned, searched };
}

function appendFanOutNotes(stages: StageMeasurement[], notes: string[]) {
	const join = stages.find((stage) => stage.stage === "join");
	const inputs = stages.filter((stage) => stage.stage === "input");
	if (!join || inputs.length < 2) return;
	const lead = inputs[0];
	if (join.rows > lead.rows && lead.rows > 0) {
		notes.push(
			`Fan-out: each of ${lead.label}'s ${lead.rows.toLocaleString()} rows matched about ${(join.rows / lead.rows).toFixed(1)} rows on the right.`,
		);
	}
	const widest = Math.max(...inputs.map((input) => input.rows));
	if (join.rows > widest) {
		notes.push(
			`The join emits ${join.rows.toLocaleString()} rows — more than any single table holds (${widest.toLocaleString()}). A join can multiply rows, not just filter them.`,
		);
	}
}

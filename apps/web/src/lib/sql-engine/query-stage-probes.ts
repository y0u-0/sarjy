import type { StageProbe } from "./query-stage-types";
import { fromSources, splitSelect } from "./select-parser";

const JOIN_PROBE_CAP = 2_000_000;

export function buildStageProbes(sql: string): {
	blockers: string[];
	notes: string[];
	probes: StageProbe[];
} {
	const parsed = splitSelect(sql);
	if (parsed.blockers.length || !parsed.from) {
		return { blockers: parsed.blockers, notes: [], probes: [] };
	}

	const prefix = parsed.withPrefix ? `${parsed.withPrefix} ` : "";
	const probes: StageProbe[] = [];
	const notes: string[] = [];
	const sources = fromSources(parsed.from);
	if (!sources) {
		notes.push(
			"Per-table row counts are unavailable: this FROM clause is a subquery, a table-valued function, or schema-qualified.",
		);
	} else {
		for (const { source, alias } of sources) {
			probes.push({
				stage: "input",
				kind: parsed.cteNames.has(source.toLowerCase()) ? "cte" : "table",
				alias,
				label: alias === source ? source : `${source} AS ${alias}`,
				sql: `${prefix}SELECT COUNT(*) FROM ${source}`,
			});
		}
	}

	if (sources && sources.length > 1) {
		if (
			!/\bJOIN\b/i.test(parsed.from) ||
			/\bCROSS\s+JOIN\b/i.test(parsed.from)
		) {
			notes.push(
				"This is a cross product: every row on the left pairs with every row on the right.",
			);
		}
		probes.push({
			stage: "join",
			label: "after JOIN",
			capped: JOIN_PROBE_CAP,
			sql: `${prefix}SELECT COUNT(*) FROM (SELECT 1 FROM ${parsed.from} LIMIT ${JOIN_PROBE_CAP + 1})`,
		});
	}
	if (parsed.where) {
		probes.push({
			stage: "where",
			label: "after WHERE",
			capped: JOIN_PROBE_CAP,
			sql: `${prefix}SELECT COUNT(*) FROM (SELECT 1 FROM ${parsed.from} WHERE ${parsed.where} LIMIT ${JOIN_PROBE_CAP + 1})`,
		});
	}

	const wrap = (having: boolean, distinct = false): string => {
		let inner = `SELECT ${distinct ? "DISTINCT " : ""}${parsed.selectList} FROM ${parsed.from}`;
		if (parsed.where) inner += ` WHERE ${parsed.where}`;
		if (parsed.groupBy) inner += ` GROUP BY ${parsed.groupBy}`;
		if (having && parsed.having) inner += ` HAVING ${parsed.having}`;
		return `${prefix}SELECT COUNT(*) FROM (${inner})`;
	};

	if (parsed.groupBy) {
		probes.push({ stage: "group", label: "groups formed", sql: wrap(false) });
	} else if (parsed.aggregated) {
		notes.push(
			"An aggregate with no GROUP BY collapses everything into a single row.",
		);
	}
	if (parsed.having) {
		probes.push({ stage: "having", label: "after HAVING", sql: wrap(true) });
	}
	if (parsed.distinct) {
		probes.push({
			stage: "distinct",
			label: "after DISTINCT",
			sql: wrap(true, true),
		});
	}
	return { blockers: [], notes, probes };
}

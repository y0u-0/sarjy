import type { PoolExercise, PoolVariant } from "./types";

export type AuthoredExercise = Omit<PoolExercise, "concept">;

const TABLE_NAMES = ["artists", "albums", "tracks", "customers", "purchases"];
const CLAUSES = [
	/\bSELECT\b/i,
	/\bFROM\b/i,
	/\bWHERE\b/i,
	/\bGROUP\s+BY\b/i,
	/\bHAVING\b/i,
	/\bORDER\s+BY\b/i,
	/\bLIMIT\b/i,
];

function complexity(referenceSql: string, concepts: string[]) {
	const normalized = referenceSql.toLowerCase();
	const tables = TABLE_NAMES.filter((table) =>
		new RegExp(`\\b${table}\\b`, "i").test(normalized),
	).length;
	const selectCount = referenceSql.match(/\bSELECT\b/gi)?.length ?? 1;
	return {
		tables: Math.max(1, tables),
		clauses: CLAUSES.filter((clause) => clause.test(referenceSql)).length,
		nestingDepth: Math.min(3, Math.max(0, selectCount - 1)),
		solutionTokens:
			referenceSql.match(/[A-Za-z_][\w]*|\d+(?:\.\d+)?|<>|<=|>=|\S/g)?.length ??
			0,
		concepts,
	};
}

export function p(
	id: string,
	title: string,
	prompt: string,
	hint: string,
	referenceSql: string,
	ordered: boolean,
	variant: PoolVariant,
	concepts: string[],
): AuthoredExercise {
	return {
		id,
		title,
		prompt,
		hint,
		referenceSql,
		ordered,
		variant,
		complexity: complexity(referenceSql, concepts),
	};
}

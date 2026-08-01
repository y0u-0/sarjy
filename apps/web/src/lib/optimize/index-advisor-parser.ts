import type { PlaygroundTable } from "@/lib/curriculum/playground";

interface Ref {
	table: string;
	column: string;
}

const CLAUSE_KEYWORDS = [
	"WHERE",
	"GROUP BY",
	"HAVING",
	"ORDER BY",
	"LIMIT",
	"OFFSET",
	"UNION",
	"WINDOW",
];

function scrub(sql: string): string {
	return sql
		.replace(/--[^\n]*/g, " ")
		.replace(/\/\*[\s\S]*?\*\//g, " ")
		.replace(/'(?:[^']|'')*'/g, (match) => " ".repeat(match.length))
		.replace(/"(?:[^"]|"")*"/g, (match) => " ".repeat(match.length));
}

function clause(sql: string, keyword: string): string {
	const upper = sql.toUpperCase();
	const start = upper.indexOf(keyword);
	if (start === -1) return "";
	const from = start + keyword.length;
	let end = sql.length;
	for (const other of CLAUSE_KEYWORDS) {
		if (other === keyword) continue;
		const at = upper.indexOf(other, from);
		if (at !== -1 && at < end) end = at;
	}
	return sql.slice(from, end);
}

function buildAliasMap(
	sql: string,
	tables: PlaygroundTable[],
): Map<string, string> {
	const known = new Set(tables.map((table) => table.name));
	const map = new Map<string, string>();
	const pattern =
		/\b(?:FROM|JOIN)\s+([A-Za-z_][\w]*)\s*(?:AS\s+)?([A-Za-z_][\w]*)?/gi;

	for (const match of sql.matchAll(pattern)) {
		const table = match[1]?.toLowerCase();
		if (!table || !known.has(table)) continue;
		map.set(table, table);
		const alias = match[2]?.toLowerCase();
		if (
			alias &&
			!CLAUSE_KEYWORDS.some((keyword) =>
				keyword.startsWith(alias.toUpperCase()),
			) &&
			![
				"on",
				"where",
				"group",
				"order",
				"left",
				"inner",
				"join",
				"using",
			].includes(alias)
		) {
			map.set(alias, table);
		}
	}
	return map;
}

function resolve(
	qualifier: string | undefined,
	column: string,
	aliases: Map<string, string>,
	tables: PlaygroundTable[],
): Ref | null {
	const col = column.toLowerCase();

	if (qualifier) {
		const table = aliases.get(qualifier.toLowerCase());
		if (!table) return null;
		const meta = tables.find((entry) => entry.name === table);
		return meta?.columns.includes(col) ? { table, column: col } : null;
	}

	const owners = [...new Set(aliases.values())]
		.map((name) => tables.find((entry) => entry.name === name))
		.filter((meta): meta is PlaygroundTable => Boolean(meta))
		.filter((meta) => meta.columns.includes(col));

	return owners.length === 1 ? { table: owners[0].name, column: col } : null;
}

function refsFromPredicates(
	text: string,
	aliases: Map<string, string>,
	tables: PlaygroundTable[],
): Ref[] {
	const refs: Ref[] = [];
	const pattern =
		/(?:([A-Za-z_][\w]*)\.)?([A-Za-z_][\w]*)\s*(?:=|>=|<=|<>|!=|>|<|\bIN\b|\bLIKE\b|\bBETWEEN\b)/gi;

	for (const match of text.matchAll(pattern)) {
		const ref = resolve(match[1], match[2], aliases, tables);
		if (ref) refs.push(ref);
	}
	return refs;
}

function refsFromColumnList(
	text: string,
	aliases: Map<string, string>,
	tables: PlaygroundTable[],
): Ref[] {
	const refs: Ref[] = [];
	for (const part of text.split(",")) {
		const match = /(?:([A-Za-z_][\w]*)\.)?([A-Za-z_][\w]*)/.exec(part.trim());
		if (!match) continue;
		const ref = resolve(match[1], match[2], aliases, tables);
		if (ref) refs.push(ref);
	}
	return refs;
}

function joinRefs(
	sql: string,
	aliases: Map<string, string>,
	tables: PlaygroundTable[],
): Ref[] {
	const refs: Ref[] = [];
	const pattern =
		/\bON\s+([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)\s*=\s*([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/gi;

	for (const match of sql.matchAll(pattern)) {
		const left = resolve(match[1], match[2], aliases, tables);
		const right = resolve(match[3], match[4], aliases, tables);
		if (left) refs.push(left);
		if (right) refs.push(right);
	}
	return refs;
}

function isAlreadyIndexed(ref: Ref): boolean {
	return ref.column === "id";
}

export function extractIndexSignals(sql: string, tables: PlaygroundTable[]) {
	const cleaned = scrub(sql);
	const aliases = buildAliasMap(cleaned, tables);
	if (aliases.size === 0) {
		return { filters: [], sorts: [], groups: [], joins: [] } satisfies Record<
			string,
			Ref[]
		>;
	}
	const usable = (ref: Ref) => !isAlreadyIndexed(ref);
	return {
		filters: refsFromPredicates(
			clause(cleaned, "WHERE"),
			aliases,
			tables,
		).filter(usable),
		sorts: refsFromColumnList(
			clause(cleaned, "ORDER BY"),
			aliases,
			tables,
		).filter(usable),
		groups: refsFromColumnList(
			clause(cleaned, "GROUP BY"),
			aliases,
			tables,
		).filter(usable),
		joins: joinRefs(cleaned, aliases, tables).filter(usable),
	};
}

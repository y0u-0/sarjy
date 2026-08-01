import type { ParsedSelect } from "./query-stage-types";
import { lexSql, type SqlToken, stripSqlComments } from "./sql-lexer";

const COMPOUND = new Set(["UNION", "INTERSECT", "EXCEPT"]);
const CLAUSE = new Set([
	"FROM",
	"WHERE",
	"GROUP",
	"HAVING",
	"WINDOW",
	"ORDER",
	"LIMIT",
]);
const JOIN_WORDS = new Set([
	"JOIN",
	"LEFT",
	"RIGHT",
	"FULL",
	"INNER",
	"OUTER",
	"CROSS",
	"NATURAL",
	"ON",
	"USING",
	"AS",
]);

export function splitSelect(rawSql: string): ParsedSelect {
	const src = stripSqlComments(rawSql).trim().replace(/;\s*$/, "").trim();
	const top = lexSql(src).filter((token) => token.depth === 0);
	const upper = (token: SqlToken) => token.v.toUpperCase();
	const blockers: string[] = [];
	const empty: ParsedSelect = {
		src,
		withPrefix: "",
		cteNames: new Set(),
		selectList: "",
		distinct: false,
		aggregated: false,
		from: null,
		where: null,
		groupBy: null,
		having: null,
		blockers,
	};

	if (top.some((token) => token.t === "word" && COMPOUND.has(upper(token)))) {
		blockers.push("compound-select");
	}
	const select = top.find(
		(token) => token.t === "word" && upper(token) === "SELECT",
	);
	if (!select) {
		blockers.push("not-a-single-select");
		return empty;
	}

	const firstWord = top.find((token) => token.t === "word");
	const withPrefix =
		firstWord && upper(firstWord) === "WITH"
			? src.slice(0, select.i).trim()
			: "";
	const cteNames = readCteNames(withPrefix);
	const marks: { w: string; i: number; end: number }[] = [];
	for (let index = 0; index < top.length; index++) {
		const token = top[index];
		if (token.t !== "word" || token.i < select.i) continue;
		const word = upper(token);
		if (word === "GROUP" || word === "ORDER") {
			const next = top.slice(index + 1).find((other) => other.t === "word");
			if (!next || upper(next) !== "BY") continue;
			marks.push({ w: `${word} BY`, i: token.i, end: next.i + next.v.length });
		} else if (CLAUSE.has(word)) {
			marks.push({ w: word, i: token.i, end: token.i + token.v.length });
		}
	}

	const firstOfEach = new Map<string, { w: string; i: number; end: number }>();
	for (const mark of marks) {
		if (!firstOfEach.has(mark.w)) firstOfEach.set(mark.w, mark);
	}
	const ordered = [...firstOfEach.values()].sort((a, b) => a.i - b.i);
	const part = (name: string): string | null => {
		const index = ordered.findIndex((mark) => mark.w === name);
		if (index === -1) return null;
		const end = index + 1 < ordered.length ? ordered[index + 1].i : src.length;
		return src.slice(ordered[index].end, end).trim();
	};

	let selectList = src
		.slice(select.i + 6, ordered.length ? ordered[0].i : src.length)
		.trim();
	let distinct = false;
	const modifier = /^(DISTINCT|ALL)\b/i.exec(selectList);
	if (modifier) {
		distinct = modifier[1].toUpperCase() === "DISTINCT";
		selectList = selectList.slice(modifier[0].length).trim();
	}
	const from = part("FROM");
	if (!from) blockers.push("no-from-clause");
	if (part("WINDOW") || /\bOVER\s*\(/i.test(selectList)) {
		blockers.push("window-function");
	}

	return {
		src,
		withPrefix,
		cteNames,
		selectList,
		distinct,
		aggregated:
			Boolean(part("GROUP BY")) ||
			/\b(COUNT|SUM|AVG|MIN|MAX|TOTAL|GROUP_CONCAT)\s*\(/i.test(selectList),
		from,
		where: part("WHERE"),
		groupBy: part("GROUP BY"),
		having: part("HAVING"),
		blockers,
	};
}

function readCteNames(withPrefix: string): Set<string> {
	const names = new Set<string>();
	if (!withPrefix) return names;
	const tokens = lexSql(withPrefix).filter((token) => token.depth === 0);
	for (const token of tokens) {
		if (token.t !== "word") continue;
		const next = tokens.find((other) => other.i > token.i);
		if (!next) continue;
		if (
			(next.t === "word" && next.v.toUpperCase() === "AS") ||
			(next.t === "punct" && next.v === "(")
		) {
			names.add(token.v.toLowerCase());
		}
	}
	return names;
}

export function fromSources(
	from: string,
): { source: string; alias: string }[] | null {
	const tokens = lexSql(from);
	for (const open of tokens.filter(
		(token) => token.t === "punct" && token.v === "(",
	)) {
		const previous = tokens.filter((token) => token.i < open.i).pop();
		const word = previous?.t === "word" ? previous.v.toUpperCase() : "";
		if (!["USING", "ON", "AND", "OR", "IN", "NOT"].includes(word)) return null;
	}

	const top = tokens.filter((token) => token.depth === 0);
	const sources: { source: string; alias: string }[] = [];
	for (let index = 0; index < top.length; index++) {
		const token = top[index];
		const previous = top[index - 1];
		const atBoundary =
			index === 0 ||
			(previous.t === "punct" && previous.v === ",") ||
			(previous.t === "word" && previous.v.toUpperCase() === "JOIN");
		if (!atBoundary || token.t !== "word") continue;
		if (JOIN_WORDS.has(token.v.toUpperCase())) continue;
		if (top[index + 1]?.t === "punct" && top[index + 1].v === ".") return null;

		let candidateIndex = index + 1;
		if (top[candidateIndex]?.v.toUpperCase() === "AS") candidateIndex++;
		const candidate = top[candidateIndex];
		const alias =
			candidate &&
			(candidate.t === "word" || candidate.t === "lit") &&
			!JOIN_WORDS.has(candidate.v.toUpperCase())
				? candidate.v
				: token.v;
		sources.push({ source: token.v, alias });
	}
	return sources.length ? sources : null;
}

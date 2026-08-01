export interface SqlToken {
	t: "word" | "lit" | "punct";
	v: string;
	i: number;
	depth: number;
}

/** Strips comments without touching string or quoted-identifier contents. */
export function stripSqlComments(sql: string): string {
	let out = "";
	let i = 0;
	while (i < sql.length) {
		const char = sql[i];
		if (char === "-" && sql[i + 1] === "-") {
			while (i < sql.length && sql[i] !== "\n") i++;
			out += " ";
			continue;
		}
		if (char === "/" && sql[i + 1] === "*") {
			i += 2;
			while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
			i += 2;
			out += " ";
			continue;
		}
		if (char === "'" || char === '"' || char === "`") {
			const quote = char;
			const start = i++;
			while (i < sql.length) {
				if (sql[i] === quote) {
					if (sql[i + 1] === quote) {
						i += 2;
						continue;
					}
					i++;
					break;
				}
				i++;
			}
			out += sql.slice(start, i);
			continue;
		}
		if (char === "[") {
			const start = i;
			while (i < sql.length && sql[i] !== "]") i++;
			i++;
			out += sql.slice(start, i);
			continue;
		}
		out += char;
		i++;
	}
	return out;
}

export function lexSql(sql: string): SqlToken[] {
	const tokens: SqlToken[] = [];
	let i = 0;
	let depth = 0;
	while (i < sql.length) {
		const char = sql[i];
		if (char === "'" || char === '"' || char === "`") {
			const quote = char;
			const start = i++;
			while (i < sql.length) {
				if (sql[i] === quote) {
					if (sql[i + 1] === quote) {
						i += 2;
						continue;
					}
					i++;
					break;
				}
				i++;
			}
			tokens.push({ t: "lit", v: sql.slice(start, i), i: start, depth });
			continue;
		}
		if (char === "[") {
			const start = i;
			while (i < sql.length && sql[i] !== "]") i++;
			i++;
			tokens.push({ t: "lit", v: sql.slice(start, i), i: start, depth });
			continue;
		}
		if (char === "(") {
			tokens.push({ t: "punct", v: "(", i, depth });
			depth++;
			i++;
			continue;
		}
		if (char === ")") {
			depth--;
			tokens.push({ t: "punct", v: ")", i, depth });
			i++;
			continue;
		}
		if (/[A-Za-z_]/.test(char)) {
			const start = i;
			while (i < sql.length && /[A-Za-z0-9_$]/.test(sql[i])) i++;
			tokens.push({ t: "word", v: sql.slice(start, i), i: start, depth });
			continue;
		}
		if (/\s/.test(char)) {
			i++;
			continue;
		}
		tokens.push({ t: "punct", v: char, i, depth });
		i++;
	}
	return tokens;
}

/**
 * Split a SQL program without mistaking semicolons inside strings, quoted
 * identifiers, or comments for statement boundaries.
 */
export function splitSqlProgram(sql: string): string[] {
	const statements: string[] = [];
	let current = "";
	let quote: "'" | '"' | "`" | "]" | null = null;
	let lineComment = false;
	let blockComment = false;
	let hasExecutableSql = false;

	for (let index = 0; index < sql.length; index++) {
		const character = sql[index] ?? "";
		const next = sql[index + 1] ?? "";
		current += character;

		if (lineComment) {
			if (character === "\n") lineComment = false;
			continue;
		}
		if (blockComment) {
			if (character === "*" && next === "/") {
				current += next;
				index += 1;
				blockComment = false;
			}
			continue;
		}
		if (quote) {
			const closing = quote === "]" ? "]" : quote;
			if (character === closing) {
				if (quote !== "]" && next === closing) {
					current += next;
					index += 1;
				} else {
					quote = null;
				}
			}
			continue;
		}

		if (character === "-" && next === "-") {
			current += next;
			index += 1;
			lineComment = true;
			continue;
		}
		if (character === "/" && next === "*") {
			current += next;
			index += 1;
			blockComment = true;
			continue;
		}
		if (character === "'" || character === '"' || character === "`") {
			quote = character;
			hasExecutableSql = true;
			continue;
		}
		if (character === "[") {
			quote = "]";
			hasExecutableSql = true;
			continue;
		}
		if (character === ";") {
			const statement = current.slice(0, -1).trim();
			if (statement && hasExecutableSql) statements.push(statement);
			current = "";
			hasExecutableSql = false;
			continue;
		}
		if (!/\s/.test(character)) hasExecutableSql = true;
	}

	const trailing = current.trim();
	if (trailing && hasExecutableSql) statements.push(trailing);
	return statements;
}

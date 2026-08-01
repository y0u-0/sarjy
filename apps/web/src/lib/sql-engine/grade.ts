import type { GradeReport, QueryResult } from "./types";

/**
 * Canonical form of a row for equality purposes: keys lowercased and sorted, so
 * column order and casing do not affect matching.
 *
 * Exported because the result visualisation diffs rows too, and if it used its own
 * notion of equality the screen could contradict the grade the student was just
 * given. One definition, two consumers.
 */
export function normalizeRow(row: Record<string, unknown>): string {
	const entries = Object.keys(row)
		.map(
			(key) =>
				[
					key.toLowerCase(),
					row[key] === null ? null : String(row[key]),
				] as const,
		)
		.sort(([a], [b]) => a.localeCompare(b));
	return JSON.stringify(entries);
}

function lowercasedColumns(result: QueryResult): Set<string> {
	return new Set(result.columns.map((column) => column.toLowerCase()));
}

function rowsMatchInOrder(actual: QueryResult, expected: QueryResult): boolean {
	return actual.rows.every(
		(row, index) => normalizeRow(row) === normalizeRow(expected.rows[index]),
	);
}

function rowsMatchAnyOrder(
	actual: QueryResult,
	expected: QueryResult,
): boolean {
	const actualSorted = actual.rows.map(normalizeRow).sort();
	const expectedSorted = expected.rows.map(normalizeRow).sort();
	return actualSorted.every((row, index) => row === expectedSorted[index]);
}

export function gradeResult(
	actual: QueryResult,
	expected: QueryResult,
	ordered: boolean,
): GradeReport {
	const actualColumns = lowercasedColumns(actual);
	const expectedColumns = lowercasedColumns(expected);
	const missingColumns = [...expectedColumns].filter(
		(column) => !actualColumns.has(column),
	);
	const extraColumns = [...actualColumns].filter(
		(column) => !expectedColumns.has(column),
	);

	const base = {
		missingColumns,
		extraColumns,
		expectedRowCount: expected.rowCount,
		actualRowCount: actual.rowCount,
	};

	if (missingColumns.length > 0 || extraColumns.length > 0) {
		return {
			...base,
			pass: false,
			status: "wrong-columns",
			message:
				missingColumns.length > 0
					? `Your result is missing column(s): ${missingColumns.join(", ")}`
					: `Your result has unexpected column(s): ${extraColumns.join(", ")}`,
		};
	}

	if (actual.rowCount !== expected.rowCount) {
		return {
			...base,
			pass: false,
			status: "wrong-row-count",
			message: `Expected ${expected.rowCount} row(s) but your query returned ${actual.rowCount}.`,
		};
	}

	if (rowsMatchInOrder(actual, expected)) {
		return { ...base, pass: true, status: "correct", message: "Correct!" };
	}

	if (rowsMatchAnyOrder(actual, expected)) {
		if (ordered) {
			return {
				...base,
				pass: false,
				status: "wrong-order",
				message:
					"The rows are right, but they are not in the expected order. Check your ORDER BY.",
			};
		}
		return { ...base, pass: true, status: "correct", message: "Correct!" };
	}

	return {
		...base,
		pass: false,
		status: "wrong-values",
		message:
			"The shape of your result looks right, but some values do not match.",
	};
}

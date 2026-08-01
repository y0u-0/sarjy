import { useCallback, useEffect, useRef, useState } from "react";

import { RECORD_SHOP_DDL } from "@/lib/curriculum";
import { getSqlEngine } from "@/lib/sql-engine/client";
import type {
	GradeReport,
	QueryResult,
	TableInfo,
	WalkResponse,
} from "@/lib/sql-engine/types";
import { SqlEngineError } from "@/lib/sql-engine/types";

export type SubmissionResponse = Awaited<
	ReturnType<ReturnType<typeof getSqlEngine>["submit"]>
>;

function previewRows(result: QueryResult): string {
	return JSON.stringify(result.rows.slice(0, 3));
}

export function useExerciseRuntime({
	referenceSql,
	observe,
}: {
	referenceSql: string;
	observe: (message: string) => void;
}) {
	const [sqlText, setSqlText] = useState("");
	const [tables, setTables] = useState<TableInfo[]>([]);
	const [busy, setBusy] = useState<"run" | "submit" | null>(null);
	const [result, setResult] = useState<QueryResult | null>(null);
	const [expected, setExpected] = useState<QueryResult | null>(null);
	const [grade, setGrade] = useState<GradeReport | null>(null);
	const [sqlError, setSqlError] = useState<string | null>(null);
	const [diffReplayKey, setDiffReplayKey] = useState(0);
	const [walk, setWalk] = useState<WalkResponse | null>(null);
	const runGeneration = useRef(0);

	useEffect(() => {
		let cancelled = false;
		const engine = getSqlEngine();
		engine
			.describe(RECORD_SHOP_DDL)
			.then((value) => {
				if (!cancelled) setTables(value);
			})
			.catch(() => {});
		engine
			.run(RECORD_SHOP_DDL, referenceSql)
			.then((response) => {
				if (!cancelled) setExpected(response.result);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
			runGeneration.current += 1;
		};
	}, [referenceSql]);

	const resetFeedback = useCallback(() => {
		setGrade(null);
		setSqlError(null);
		setWalk(null);
	}, []);

	const loadWalk = useCallback((sql: string, generation: number) => {
		getSqlEngine()
			.walk(RECORD_SHOP_DDL, sql)
			.then((nextWalk) => {
				if (generation === runGeneration.current) setWalk(nextWalk);
			})
			.catch(() => {
				if (generation === runGeneration.current) setWalk(null);
			});
	}, []);

	const handleError = useCallback(
		(error: unknown, sql: string) => {
			if (error instanceof SqlEngineError) {
				setSqlError(error.message);
				setResult(null);
				observe(
					`The student's query failed.\nSQL:\n${sql}\n${error.kind === "timeout" ? "It timed out." : `Error: ${error.message}`}`,
				);
				return;
			}
			setSqlError("Something went wrong running your query.");
		},
		[observe],
	);

	const run = useCallback(async () => {
		if (busy || !sqlText.trim()) return;
		const generation = ++runGeneration.current;
		setBusy("run");
		resetFeedback();
		try {
			const response = await getSqlEngine().run(RECORD_SHOP_DDL, sqlText);
			if (generation !== runGeneration.current) return;
			setResult(response.result);
			setDiffReplayKey((key) => key + 1);
			loadWalk(sqlText, generation);
			observe(
				`The student ran a query.\nSQL:\n${sqlText}\nIt returned ${response.result.rowCount} row(s) with columns [${response.result.columns.join(", ")}]. First rows: ${previewRows(response.result)}`,
			);
		} catch (error) {
			if (generation === runGeneration.current) handleError(error, sqlText);
		} finally {
			if (generation === runGeneration.current) setBusy(null);
		}
	}, [busy, handleError, loadWalk, observe, resetFeedback, sqlText]);

	const submit = useCallback(
		async (ordered: boolean) => {
			if (busy || !sqlText.trim()) return null;
			const generation = ++runGeneration.current;
			setBusy("submit");
			resetFeedback();
			try {
				const response = await getSqlEngine().submit(
					RECORD_SHOP_DDL,
					sqlText,
					referenceSql,
					ordered,
				);
				if (generation !== runGeneration.current) return null;
				setResult(response.result);
				setExpected(response.expected);
				setGrade(response.grade);
				setDiffReplayKey((key) => key + 1);
				loadWalk(sqlText, generation);
				return response;
			} catch (error) {
				if (generation === runGeneration.current) handleError(error, sqlText);
				return null;
			} finally {
				if (generation === runGeneration.current) setBusy(null);
			}
		},
		[busy, handleError, loadWalk, referenceSql, resetFeedback, sqlText],
	);

	return {
		state: {
			sqlText,
			tables,
			busy,
			result,
			expected,
			grade,
			sqlError,
			diffReplayKey,
			walk,
		},
		actions: { setSqlText, setGrade, setSqlError, run, submit },
	};
}

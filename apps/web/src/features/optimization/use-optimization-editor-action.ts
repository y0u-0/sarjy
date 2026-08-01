import { useCallback } from "react";
import { toast } from "sonner";

import type { OptimizationState } from "./use-optimization-state";

export function useOptimizationEditorAction(
	state: OptimizationState,
	askTeacher: (message: string) => void,
) {
	return useCallback(() => {
		const sql =
			state.problem.mode === "index"
				? state.indexSql.trim()
				: state.rewriteSql.trim();
		if (!sql) {
			toast.info("Write your change first, then ask Sarjy to measure it.");
			return;
		}
		askTeacher(
			`I've written my ${state.problem.mode === "index" ? "index" : "rewrite"}. Please review and measure this exact SQL:\n${sql}`,
		);
	}, [askTeacher, state.indexSql, state.problem.mode, state.rewriteSql]);
}

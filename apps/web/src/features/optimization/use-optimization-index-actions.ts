import { useCallback } from "react";
import { toast } from "sonner";

import {
	type IndexOptimizationProblem,
	optimizationDatasets,
} from "@/lib/curriculum/optimization-bank";
import { blockLab } from "@/lib/optimize/lab-controller";
import { evaluateIndexAttempt } from "@/lib/optimize/success";
import { getSqlEngine } from "@/lib/sql-engine/client";
import { diffPlans } from "@/lib/sql-engine/explain";

import {
	type AppliedIndex,
	type IndexMeasurementSuccess,
	indexLabel,
	type Measurement,
	measurementSummary,
	OPTIMIZATION_SQL_SCOPE,
} from "./optimization-model";
import type { OptimizationSession } from "./optimization-session";
import type { OptimizationState } from "./use-optimization-state";

interface IndexActionOptions {
	state: OptimizationState;
	session: OptimizationSession;
	revealComparison: (note: string | null) => void;
	loadBaseline: (target: IndexOptimizationProblem) => Promise<string>;
	logAttempt: (
		target: IndexOptimizationProblem,
		sql: string,
		result: ReturnType<typeof evaluateIndexAttempt>,
	) => void;
	observe: (message: string) => void;
}

export function useOptimizationIndexActions(options: IndexActionOptions) {
	const {
		state,
		session,
		revealComparison,
		loadBaseline,
		logAttempt,
		observe,
	} = options;

	const measureIndexSet = useCallback(
		async (
			target: IndexOptimizationProblem,
			next: AppliedIndex[],
		): Promise<IndexMeasurementSuccess | string> => {
			const revision = ++state.requestRevision.current;
			state.setBusy(true);
			try {
				const dataset = optimizationDatasets[target.datasetId];
				const response = await getSqlEngine().optimize(
					dataset.ddl,
					target.querySql,
					{
						indexes: next.map((entry) => entry.sql),
						samples: 5,
						matchedSql: target.illustration.matchedSql,
						withStages: true,
						withData: true,
						supersedeKey: OPTIMIZATION_SQL_SCOPE,
					},
				);
				const measurement: Measurement = {
					plan: response.plan,
					benchmark: response.benchmark,
					matchedRows: response.matchedRows,
					stages: response.stages,
					walk: response.data?.walk ?? null,
					sample: response.data?.sample ?? null,
				};
				if (revision !== state.requestRevision.current) {
					return "A newer problem replaced this index measurement.";
				}
				const outcome = evaluateIndexAttempt(target, response);
				const diff = diffPlans(
					state.baselineRef.current?.plan ?? null,
					response.plan,
				);
				state.indexesRef.current = next;
				state.candidateRef.current = measurement;
				state.setIndexes(next);
				state.setCandidate(measurement);
				state.setDiff(diff);
				state.setOutcome(outcome);
				state.setAlternativesVisible(false);
				state.setStage("compare");
				state.setTimelineCursor(4);
				revealComparison(diff.headline);
				return {
					measurement,
					diff,
					outcome,
					summary: measurementSummary(measurement, diff),
				};
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "The index failed.";
				if (revision === state.requestRevision.current) toast.error(message);
				return `The index set could not be measured: ${message}`;
			} finally {
				if (revision === state.requestRevision.current) state.setBusy(false);
			}
		},
		[revealComparison, state],
	);

	return useCallback(
		async (sql: string, rationale: string, learnerTurn: number) => {
			const target = state.problemRef.current;
			if (target.mode !== "index") {
				return blockLab(
					"This is a rewrite problem. Use the rewrite tool instead.",
				);
			}
			const trimmed = sql.trim().replace(/;$/, "");
			if (!/^CREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(trimmed)) {
				return blockLab(
					"That is not a CREATE INDEX statement, so it was not applied.",
				);
			}
			if (state.indexesRef.current.some((entry) => entry.sql === trimmed)) {
				return blockLab("That exact index is already applied.");
			}
			const lesson = session.preview({ type: "apply-change", learnerTurn });
			if (!lesson.accepted) return blockLab(lesson.message);
			if (!state.baselineRef.current) {
				const result = await loadBaseline(target);
				if (!state.baselineRef.current) return blockLab(result);
			}
			const next = [
				...state.indexesRef.current,
				{ sql: trimmed, label: indexLabel(trimmed) },
			];
			const measured = await measureIndexSet(target, next);
			if (typeof measured === "string") return blockLab(measured);
			session.commit(lesson.state);
			state.setIndexSql("");
			logAttempt(
				target,
				next.map((entry) => entry.sql).join(";\n"),
				measured.outcome,
			);
			observe(
				`The learner applied ${trimmed}.${rationale ? ` Rationale: ${rationale}.` : ""} Measurement finished. Result rows are visible; keep plan and performance conclusions hidden until the learner verifies correctness.`,
			);
			return "Measurement finished. The before/after result rows are visible. Ask whether the answers match, then stop and wait.";
		},
		[loadBaseline, logAttempt, measureIndexSet, observe, session, state],
	);
}

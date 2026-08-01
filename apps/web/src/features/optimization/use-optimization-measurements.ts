import { type QueryClient, useMutation } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import {
	type OptimizationLabProblem,
	optimizationDatasets,
} from "@/lib/curriculum/optimization-bank";
import type { OptimizationOutcome } from "@/lib/optimize/success";
import { getSqlEngine } from "@/lib/sql-engine/client";
import { orpc } from "@/utils/orpc";

import {
	type Measurement,
	measurementSummary,
	OPTIMIZATION_SQL_SCOPE,
} from "./optimization-model";
import type { OptimizationState } from "./use-optimization-state";

export function useOptimizationMeasurements(
	state: OptimizationState,
	queryClient: QueryClient,
) {
	const recordAttempt = useMutation(
		orpc.progress.recordOptimizationAttempt.mutationOptions({
			onSuccess: () => void queryClient.invalidateQueries(),
		}),
	);

	const logAttempt = useCallback(
		(
			target: OptimizationLabProblem,
			sql: string,
			result: OptimizationOutcome,
		) => {
			recordAttempt.mutate({
				exerciseId: `opt-${target.id}`,
				concept: target.concept,
				sql,
				passed: result.passed,
				kind: result.kind,
				elapsedMs: Date.now() - state.attemptStartedAt.current,
				predicted: null,
				hintShown: false,
				gaveUp: false,
			});
			state.attemptStartedAt.current = Date.now();
		},
		[recordAttempt, state],
	);

	const loadBaseline = useCallback(
		async (target: OptimizationLabProblem) => {
			const revision = ++state.requestRevision.current;
			const dataset = optimizationDatasets[target.datasetId];
			state.setBusy(true);
			try {
				const response =
					target.mode === "index"
						? await getSqlEngine().optimize(dataset.ddl, target.querySql, {
								samples: 5,
								matchedSql: target.illustration.matchedSql,
								withStages: true,
								withData: true,
								supersedeKey: OPTIMIZATION_SQL_SCOPE,
							})
						: await getSqlEngine().optimize(dataset.ddl, target.baselineSql, {
								indexes: target.indexes,
								samples: 1,
								withData: true,
								supersedeKey: OPTIMIZATION_SQL_SCOPE,
							});
				const measurement: Measurement = {
					plan: response.plan,
					benchmark: response.benchmark,
					walk: response.data?.walk ?? null,
					sample: response.data?.sample ?? null,
					...(target.mode === "index"
						? { matchedRows: response.matchedRows, stages: response.stages }
						: {}),
				};
				if (revision !== state.requestRevision.current) {
					return "A newer problem replaced this measurement.";
				}
				state.setBaseline(measurement);
				state.baselineRef.current = measurement;
				state.setCandidate(null);
				state.candidateRef.current = null;
				state.setComparison(null);
				state.setDiff(null);
				state.setOutcome(null);
				state.setReplayKey((key) => key + 1);
				return measurementSummary(measurement, null);
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Could not measure this problem.";
				if (revision === state.requestRevision.current) toast.error(message);
				return `The measurement failed: ${message}`;
			} finally {
				if (revision === state.requestRevision.current) state.setBusy(false);
			}
		},
		[state],
	);

	useEffect(() => {
		let cancelled = false;
		const dataset = optimizationDatasets[state.problem.datasetId];
		getSqlEngine()
			.describe(dataset.ddl)
			.then((tables) => {
				if (!cancelled) state.setTables(tables);
			})
			.catch(() => {
				if (!cancelled) state.setTables([]);
			});
		return () => {
			cancelled = true;
		};
	}, [state.problem.datasetId, state.setTables]);

	useEffect(() => () => getSqlEngine().cancelScope(OPTIMIZATION_SQL_SCOPE), []);

	return { loadBaseline, logAttempt };
}

import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { toast } from "sonner";

import { useTeacher } from "@/components/teacher/teacher-provider";
import { getSqlEngine } from "@/lib/sql-engine/client";
import type { QueryPlan, SubmitResponse } from "@/lib/sql-engine/types";
import { client } from "@/utils/orpc";

import {
	DEFAULT_LIVE_DATA_SQL,
	previewQueryResult,
	weatherBlocked,
} from "./live-data-session-model";
import type {
	WeatherBusy,
	WeatherReveal,
	WeatherSessionRefs,
	WeatherTransition,
} from "./weather-session-types";

export function useWeatherQueryCommand(options: {
	busy: WeatherBusy;
	refs: WeatherSessionRefs;
	transition: WeatherTransition;
	reveal: WeatherReveal;
	setSubmission: Dispatch<SetStateAction<SubmitResponse | null>>;
	setPlan: Dispatch<SetStateAction<QueryPlan | null>>;
	setBusy: Dispatch<SetStateAction<WeatherBusy>>;
}) {
	const teacher = useTeacher();
	return useCallback(async () => {
		const mission = options.refs.mission.current;
		if (!mission) return weatherBlocked("Create a mission first.");
		if (!options.refs.lesson.current.prediction) {
			return weatherBlocked(
				"Ask for and record the learner's prediction first.",
			);
		}
		const sql = options.refs.query.current.trim();
		if (!sql || sql === DEFAULT_LIVE_DATA_SQL) {
			return weatherBlocked("The learner's SQL editor is empty.");
		}
		if (options.busy === "query")
			return weatherBlocked("That query is already being checked.");

		const revision = ++options.refs.requestRevision.current;
		options.setBusy("query");
		try {
			const response = await getSqlEngine().submit(
				mission.schemaSql,
				sql,
				mission.challenge.referenceSql,
				mission.challenge.ordered,
			);
			if (revision !== options.refs.requestRevision.current) {
				return weatherBlocked("A newer request replaced this query check.");
			}
			const passedBeforeCheck = options.refs.lesson.current.queryPassed;
			const checked = options.transition({
				type: "query-checked",
				passed: response.grade.pass,
			});
			if (!checked.accepted) return weatherBlocked(checked.message);
			options.setSubmission(response);
			options.reveal(
				"result",
				response.grade.pass
					? "The answer matches."
					: "Use the difference to diagnose one gap.",
			);

			try {
				const measured = await getSqlEngine().optimize(mission.schemaSql, sql, {
					samples: 1,
					withData: false,
				});
				if (revision === options.refs.requestRevision.current)
					options.setPlan(measured.plan);
			} catch {
				if (revision === options.refs.requestRevision.current)
					options.setPlan(null);
			}

			if (!passedBeforeCheck) {
				void client.progress
					.recordLiveDataAttempt({
						exerciseId: `${mission.challenge.id}:${mission.id}`,
						concept: mission.challenge.concept,
						sql,
						passed: response.grade.pass,
						kind:
							response.grade.status === "correct"
								? null
								: response.grade.status,
						elapsedMs: Math.min(
							Date.now() - options.refs.attemptStartedAt.current,
							86_400_000,
						),
						predicted: null,
						hintShown: teacher.hint?.sql != null,
						gaveUp: false,
					})
					.then(() => {
						options.refs.attemptStartedAt.current = Date.now();
					})
					.catch((error) =>
						console.warn("[live-data] could not record graded evidence", error),
					);
			}

			return [
				response.grade.pass ? "PASS." : "NOT YET.",
				response.grade.message,
				`Actual result: ${response.result.rowCount} row(s), columns [${response.result.columns.join(", ")}].`,
				`First rows: ${previewQueryResult(response)}.`,
				response.grade.pass
					? "Connect this result to the chart next; do not complete the mission yet."
					: "Coach one correction and let the learner resubmit.",
			].join("\n");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "The SQL could not run.";
			toast.error(message);
			return `The learner's query failed safely in the browser sandbox: ${message}`;
		} finally {
			if (revision === options.refs.requestRevision.current)
				options.setBusy(null);
		}
	}, [options, teacher.hint?.sql]);
}

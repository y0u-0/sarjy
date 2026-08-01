import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";
import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { toast } from "sonner";

import { getSqlEngine } from "@/lib/sql-engine/client";
import type {
	QueryPlan,
	SubmitResponse,
	TableInfo,
} from "@/lib/sql-engine/types";
import { client } from "@/utils/orpc";

import {
	DEFAULT_LIVE_DATA_SQL,
	isWeatherMissionFocus,
	weatherBlocked,
} from "./live-data-session-model";
import type {
	WeatherBusy,
	WeatherReveal,
	WeatherSessionRefs,
	WeatherTransition,
} from "./weather-session-types";

interface MissionCommandOptions {
	busy: WeatherBusy;
	refs: WeatherSessionRefs;
	transition: WeatherTransition;
	reveal: WeatherReveal;
	setMission: Dispatch<SetStateAction<WeatherMission | null>>;
	setQuerySql: Dispatch<SetStateAction<string>>;
	setTables: Dispatch<SetStateAction<TableInfo[]>>;
	setSubmission: Dispatch<SetStateAction<SubmitResponse | null>>;
	setPlan: Dispatch<SetStateAction<QueryPlan | null>>;
	setBusy: Dispatch<SetStateAction<WeatherBusy>>;
}

export function useWeatherMissionCommands(options: MissionCommandOptions) {
	const createMission = useCallback(
		async (cities: string[], focus: string, days: number) => {
			if (options.busy === "mission")
				return weatherBlocked("A mission is already loading.");
			if (!isWeatherMissionFocus(focus)) {
				return weatherBlocked("Choose foundations, aggregation, or windows.");
			}
			const revision = ++options.refs.requestRevision.current;
			options.setBusy("mission");
			try {
				const mission = await client.weather.createMission({
					cities,
					focus,
					days: Number.isFinite(days) ? days : 7,
				});
				if (revision !== options.refs.requestRevision.current) {
					return weatherBlocked("A newer mission replaced this request.");
				}
				const next = options.transition({
					type: "mission-created",
					missionId: mission.id,
				});
				if (!next.accepted) return weatherBlocked(next.message);

				options.refs.mission.current = mission;
				options.setMission(mission);
				options.setQuerySql(DEFAULT_LIVE_DATA_SQL);
				options.setSubmission(null);
				options.setPlan(null);
				options.setTables([]);
				options.refs.attemptStartedAt.current = Date.now();
				options.reveal("question", "Start with a prediction—not the data.");
				void getSqlEngine()
					.describe(mission.schemaSql)
					.then((tables) => {
						if (options.refs.mission.current?.id === mission.id)
							options.setTables(tables);
					})
					.catch(() => {
						if (options.refs.mission.current?.id === mission.id)
							options.setTables([]);
					});

				return [
					`Mission ${mission.id} is frozen and visible.`,
					`Challenge: ${mission.challenge.title}. ${mission.challenge.prompt}`,
					`Prediction to ask verbatim: ${mission.challenge.predictionPrompt}`,
					`Schema: ${mission.schemaSummary}`,
					`Period: ${mission.period.startDate} through ${mission.period.endDate}; ${mission.observationCount} hourly rows.`,
					"Do not reveal data, chart, result, plan, or answer yet. Ask the prediction and wait.",
				].join("\n");
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "The weather source could not build this mission.";
				toast.error(message);
				return weatherBlocked(
					`${message} Keep the city-choice screen visible and offer one retry.`,
				);
			} finally {
				if (revision === options.refs.requestRevision.current)
					options.setBusy(null);
			}
		},
		[options],
	);

	const recordPrediction = useCallback(
		(response: string) => {
			const next = options.transition({ type: "record-prediction", response });
			if (!next.accepted) return weatherBlocked(next.message);
			options.reveal("question", "Prediction saved. Now test it with SQL.");
			return next.message;
		},
		[options],
	);

	return { createMission, recordPrediction };
}

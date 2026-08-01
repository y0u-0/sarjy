import { useCallback } from "react";

import { useTeacher } from "@/components/teacher/teacher-provider";
import { isWeatherSurface } from "@/lib/live-data/weather-controller";
import type { SubmitResponse } from "@/lib/sql-engine/types";

import {
	describeLiveDataSession,
	weatherBlocked,
} from "./live-data-session-model";
import type {
	WeatherReveal,
	WeatherSessionRefs,
	WeatherTransition,
} from "./weather-session-types";

export function useWeatherSurfaceCommands(options: {
	refs: WeatherSessionRefs;
	transition: WeatherTransition;
	reveal: WeatherReveal;
	surface: string;
	submission: SubmitResponse | null;
}) {
	const teacher = useTeacher();
	const describe = useCallback(
		() =>
			describeLiveDataSession({
				mission: options.refs.mission.current,
				lesson: options.refs.lesson.current,
				surface: options.surface,
				querySql: options.refs.query.current,
			}),
		[options],
	);
	const setSurface = useCallback(
		(nextSurface: string, note: string) => {
			if (!options.refs.mission.current)
				return weatherBlocked("Create a mission first.");
			if (!isWeatherSurface(nextSurface))
				return weatherBlocked("Unknown teaching surface.");
			if (nextSurface !== "question") {
				const next = options.transition({
					type: "reveal-evidence",
					surface: nextSurface,
				});
				if (!next.accepted) return weatherBlocked(next.message);
				if (
					(nextSurface === "result" || nextSurface === "plan") &&
					!options.submission
				) {
					return weatherBlocked(
						"Check the learner's current query before showing that surface.",
					);
				}
			}
			options.reveal(nextSurface, note.trim() || null);
			return `Showing only the ${nextSurface} surface. ${note}`.trim();
		},
		[options],
	);
	const recordExplanation = useCallback(
		(correct: boolean, rationale: string) => {
			const next = options.transition({ type: "record-explanation", correct });
			if (!next.accepted) return weatherBlocked(next.message);
			teacher.observe(`Live-data teach-back: ${rationale}`);
			return next.message;
		},
		[options, teacher.observe],
	);
	return { describe, setSurface, recordExplanation };
}

import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";
import { useCallback, useMemo, useRef, useState } from "react";

import { useTeacher } from "@/components/teacher/teacher-provider";
import type {
	WeatherController,
	WeatherSurface,
} from "@/lib/live-data/weather-controller";
import {
	createWeatherLesson,
	transitionWeatherLesson,
	type WeatherLessonAction,
	type WeatherLessonState,
} from "@/lib/live-data/weather-lesson";
import type {
	QueryPlan,
	SubmitResponse,
	TableInfo,
} from "@/lib/sql-engine/types";

import { DEFAULT_LIVE_DATA_SQL } from "./live-data-session-model";
import { useLiveDataTeacherBridge } from "./use-live-data-teacher-bridge";
import { useWeatherMissionCommands } from "./use-weather-mission-commands";
import { useWeatherQueryCommand } from "./use-weather-query-command";
import { useWeatherSurfaceCommands } from "./use-weather-surface-commands";
import type { WeatherBusy, WeatherSessionRefs } from "./weather-session-types";

export function useLiveDataSession() {
	const teacher = useTeacher();
	const [mission, setMission] = useState<WeatherMission | null>(null);
	const [lesson, setLesson] = useState<WeatherLessonState>(createWeatherLesson);
	const [surface, setSurface] = useState<WeatherSurface>("question");
	const [surfaceNote, setSurfaceNote] = useState<string | null>(null);
	const [querySql, setQuerySql] = useState(DEFAULT_LIVE_DATA_SQL);
	const [tables, setTables] = useState<TableInfo[]>([]);
	const [submission, setSubmission] = useState<SubmitResponse | null>(null);
	const [plan, setPlan] = useState<QueryPlan | null>(null);
	const [busy, setBusy] = useState<WeatherBusy>(null);
	const missionRef = useRef<WeatherMission | null>(null);
	const lessonRef = useRef(lesson);
	const queryRef = useRef(querySql);
	const requestRevision = useRef(0);
	const attemptStartedAt = useRef(Date.now());
	lessonRef.current = lesson;
	queryRef.current = querySql;
	const refs = useMemo<WeatherSessionRefs>(
		() => ({
			mission: missionRef,
			lesson: lessonRef,
			query: queryRef,
			requestRevision,
			attemptStartedAt,
		}),
		[],
	);

	const transition = useCallback((action: WeatherLessonAction) => {
		const next = transitionWeatherLesson(lessonRef.current, action);
		if (next.accepted) {
			lessonRef.current = next.state;
			setLesson(next.state);
		}
		return next;
	}, []);
	const reveal = useCallback((next: WeatherSurface, note: string | null) => {
		setSurface(next);
		setSurfaceNote(note);
		requestAnimationFrame(() => {
			document
				.querySelector<HTMLElement>(`[data-live-data-surface="${next}"]`)
				?.scrollIntoView({ behavior: "smooth", block: "center" });
		});
	}, []);

	const missionCommands = useWeatherMissionCommands(
		useMemo(
			() => ({
				busy,
				refs,
				transition,
				reveal,
				setMission,
				setQuerySql,
				setTables,
				setSubmission,
				setPlan,
				setBusy,
			}),
			[busy, refs, reveal, transition],
		),
	);
	const checkQuery = useWeatherQueryCommand(
		useMemo(
			() => ({
				busy,
				refs,
				transition,
				reveal,
				setSubmission,
				setPlan,
				setBusy,
			}),
			[busy, refs, reveal, transition],
		),
	);
	const surfaceCommands = useWeatherSurfaceCommands(
		useMemo(
			() => ({ refs, transition, reveal, surface, submission }),
			[refs, transition, reveal, surface, submission],
		),
	);
	const controller = useMemo<WeatherController>(
		() => ({
			...missionCommands,
			...surfaceCommands,
			checkQuery,
		}),
		[checkQuery, missionCommands, surfaceCommands],
	);
	useLiveDataTeacherBridge({
		controller,
		mission,
		lesson,
		surface,
		querySql,
	});

	return {
		mission,
		lesson,
		surface,
		surfaceNote,
		querySql,
		tables,
		submission,
		plan,
		busy,
		suggestion: teacher.hint?.sql ?? null,
		setQuerySql,
		checkQuery,
		dismissSuggestion: (accepted: boolean) =>
			teacher.dismissHint(accepted ? "accepted" : "dismissed"),
	};
}

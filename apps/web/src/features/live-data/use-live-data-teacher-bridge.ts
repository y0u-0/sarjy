import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";
import { useEffect } from "react";
import { useTeacher } from "@/components/teacher/teacher-provider";
import type { WeatherController } from "@/lib/live-data/weather-controller";
import type { WeatherLessonState } from "@/lib/live-data/weather-lesson";

import { liveDataScreenSummary } from "./live-data-session-model";

export function useLiveDataTeacherBridge({
	controller,
	mission,
	lesson,
	surface,
	querySql,
}: {
	controller: WeatherController;
	mission: WeatherMission | null;
	lesson: WeatherLessonState;
	surface: string;
	querySql: string;
}) {
	const teacher = useTeacher();
	useEffect(() => {
		teacher.registerWeather(controller);
		return () => teacher.registerWeather(null);
	}, [teacher.registerWeather, controller]);
	useEffect(() => {
		teacher.setScreenContext({
			kind: "live-data",
			title: mission
				? `Live data: ${mission.challenge.title}`
				: "Live data mission",
			summary: liveDataScreenSummary(mission, lesson),
			entityId: mission?.id,
			concept: mission?.challenge.concept,
		});
		return () => teacher.setScreenContext(null);
	}, [lesson, mission, teacher.setScreenContext]);
	useEffect(() => {
		if (teacher.status !== "connected" || !mission) return;
		teacher.observe(
			`Live-data screen snapshot. Checkpoint: ${lesson.checkpoint}. Visible surface: ${surface}. Editor:\n${querySql}`,
		);
	}, [
		lesson.checkpoint,
		mission,
		querySql,
		surface,
		teacher.observe,
		teacher.status,
	]);
}

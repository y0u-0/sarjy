import { useEffect, useRef } from "react";

import type { useTeacher } from "@/components/teacher/teacher-provider";
import type { ExerciseWithLesson } from "@/lib/curriculum/types";

const EDITOR_OBSERVE_DELAY_MS = 1500;
const SELECTION_OBSERVE_DELAY_MS = 800;

export function useExerciseObservations({
	entry,
	sqlText,
	selectionText,
	teacher,
}: {
	entry: ExerciseWithLesson;
	sqlText: string;
	selectionText?: string;
	teacher: ReturnType<typeof useTeacher>;
}) {
	const sqlTextRef = useRef("");
	sqlTextRef.current = sqlText;

	useEffect(() => {
		teacher.setCurrentExercise(entry);
	}, [teacher.setCurrentExercise, entry]);

	useEffect(() => {
		if (teacher.status !== "connected") return;
		teacher.observe(
			`Screen snapshot. The student is on "${entry.exercise.title}" (${entry.lesson.title}): ${entry.exercise.prompt}\nTheir editor currently contains:\n${sqlTextRef.current || "(empty)"}`,
		);
	}, [teacher.status, teacher.observe, entry]);

	useEffect(() => {
		if (!sqlText.trim()) return;
		const timer = setTimeout(() => {
			teacher.observe(`The student's editor now contains:\n${sqlText}`);
		}, EDITOR_OBSERVE_DELAY_MS);
		return () => clearTimeout(timer);
	}, [sqlText, teacher.observe]);

	useEffect(() => {
		if (!selectionText) return;
		const timer = setTimeout(() => {
			teacher.observe(
				`The student highlighted this text on screen: "${selectionText.slice(0, 600)}"\n(Their editor contains:\n${sqlTextRef.current || "(empty)"})`,
			);
		}, SELECTION_OBSERVE_DELAY_MS);
		return () => clearTimeout(timer);
	}, [selectionText, teacher.observe]);
}

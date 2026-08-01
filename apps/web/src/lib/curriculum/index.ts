import { RECORD_SHOP_DDL } from "./dataset";
import { lessons } from "./lessons";
import { poolExerciseById } from "./practice-pool";
import type { Exercise, ExerciseWithLesson, Lesson } from "./types";

const orderedExercises: { exercise: Exercise; lesson: Lesson }[] =
	lessons.flatMap((lesson) =>
		lesson.exercises.map((exercise) => ({ exercise, lesson })),
	);

const exerciseIndexById = new Map(
	orderedExercises.map((entry, index) => [entry.exercise.id, index]),
);

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

/**
 * Held-back exercises resolve by id but stay out of `orderedExercises`, so the
 * numbered curriculum keeps its length whether or not a student has unlocked
 * anything. That is what makes the pool genuinely hidden rather than merely
 * unlisted — the progression cannot grow under the student's feet, and no count
 * anywhere implies there is more work owed.
 */
function poolEntry(id: string): ExerciseWithLesson | null {
	const exercise = poolExerciseById(id);
	const lesson = exercise && lessonById.get(exercise.concept);
	if (!exercise || !lesson) return null;

	return {
		exercise,
		lesson,
		index: 0,
		total: 0,
		poolVariant: exercise.variant,
		previousId: null,
		nextId: null,
	};
}

export function getExercise(id: string): ExerciseWithLesson | null {
	const index = exerciseIndexById.get(id);
	if (index === undefined) return poolEntry(id);
	const entry = orderedExercises[index];
	if (!entry) return null;
	return {
		exercise: entry.exercise,
		lesson: entry.lesson,
		index,
		total: orderedExercises.length,
		poolVariant: null,
		previousId: orderedExercises[index - 1]?.exercise.id ?? null,
		nextId: orderedExercises[index + 1]?.exercise.id ?? null,
	};
}

export function getFirstExerciseId(): string {
	return orderedExercises[0].exercise.id;
}

export function getExerciseCount(): number {
	return orderedExercises.length;
}

export type { Exercise, ExerciseWithLesson, Lesson } from "./types";
export { lessons, RECORD_SHOP_DDL };

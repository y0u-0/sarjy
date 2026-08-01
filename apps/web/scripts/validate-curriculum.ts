import { Database } from "bun:sqlite";

import { RECORD_SHOP_DDL } from "../src/lib/curriculum/dataset";
import { lessons } from "../src/lib/curriculum/lessons";
import { practicePool } from "../src/lib/curriculum/practice-pool";
import type { Exercise } from "../src/lib/curriculum/types";

let failures = 0;

interface CurriculumEntry {
	concept: string;
	exercise: Exercise;
}

const lessonConcepts = new Set(lessons.map((lesson) => lesson.id));
const core: CurriculumEntry[] = lessons.flatMap((lesson) =>
	lesson.exercises.map((exercise) => ({ concept: lesson.id, exercise })),
);
const heldBack: CurriculumEntry[] = Object.entries(practicePool).flatMap(
	([concept, exercises]) =>
		exercises.map((exercise) => ({ concept, exercise })),
);
const all = [...core, ...heldBack];

if (all.length < 200) {
	console.error(
		`Question bank has ${all.length} exercises; expected at least 200`,
	);
	failures++;
}

const ids = new Set<string>();
for (const { concept, exercise } of all) {
	if (ids.has(exercise.id)) {
		console.error(`Duplicate exercise id: ${exercise.id}`);
		failures++;
	}
	ids.add(exercise.id);
	if (!lessonConcepts.has(concept)) {
		console.error(`${exercise.id} points to unknown concept ${concept}`);
		failures++;
	}
	if (
		!exercise.title.trim() ||
		!exercise.prompt.trim() ||
		!exercise.hint.trim()
	) {
		console.error(
			`${concept}/${exercise.id} has incomplete learner-facing copy`,
		);
		failures++;
	}
	if (!/^\s*(?:SELECT|WITH)\b/i.test(exercise.referenceSql)) {
		console.error(`${concept}/${exercise.id} is not a read-only query`);
		failures++;
	}
	if (exercise.ordered && !/\bORDER\s+BY\b/i.test(exercise.referenceSql)) {
		console.error(
			`${concept}/${exercise.id} requires order but has no ORDER BY`,
		);
		failures++;
	}
}

for (const lesson of lessons) {
	const poolCount = practicePool[lesson.id]?.length ?? 0;
	if (lesson.exercises.length < 2 || poolCount < 2) {
		console.error(
			`${lesson.id} needs at least two anchors and two transfer exercises`,
		);
		failures++;
	}
}

for (const { concept, exercise } of all) {
	const db = new Database(":memory:");
	try {
		db.exec(RECORD_SHOP_DDL);
		const rows = db.query(exercise.referenceSql).all();
		if (rows.length === 0) {
			console.error(`${concept}/${exercise.id}: EMPTY (suspicious)`);
			failures++;
		}
	} catch (error) {
		failures++;
		console.error(
			`${concept}/${exercise.id}: FAILED: ${(error as Error).message}`,
		);
	} finally {
		db.close();
	}
}

if (failures > 0) {
	console.error(`\n${failures} exercise(s) need attention`);
	process.exit(1);
}
console.log(
	`Validated ${all.length} exercises across ${lessons.length} concepts (${core.length} anchors, ${heldBack.length} transfer questions)`,
);

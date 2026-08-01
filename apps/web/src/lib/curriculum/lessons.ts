import { expandedLessons } from "./expanded-lessons";
import { advancedCoreLessons } from "./lessons-advanced-core";
import { foundationLessons } from "./lessons-foundations";
import { relationalLessons } from "./lessons-relational";
import type { Lesson } from "./types";

export const lessons: Lesson[] = [
	...foundationLessons,
	...relationalLessons,
	...advancedCoreLessons,
	...expandedLessons,
];

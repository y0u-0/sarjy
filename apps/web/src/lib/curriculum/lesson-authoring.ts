import type { Exercise } from "./types";

export function exercise(
	id: string,
	title: string,
	prompt: string,
	hint: string,
	referenceSql: string,
	ordered = false,
): Exercise {
	return { id, title, prompt, hint, referenceSql, ordered };
}

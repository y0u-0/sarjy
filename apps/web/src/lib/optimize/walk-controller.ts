/**
 * Lets Sarjy drive the row-by-row animation instead of only watching it.
 *
 * She needs to be able to stop on a specific row and say why it failed the
 * predicate, so every method reports back what is now on screen. `describe` exists
 * so she can ask "where are we?" without moving anything — otherwise she would
 * have to step to find out, which changes what the student is looking at.
 */
export interface WalkController {
	/** Jump to a 1-based row number and pause there. */
	stepTo(rowNumber: number): string;
	next(): string;
	previous(): string;
	play(): string;
	pause(): string;
	restart(): string;
	/** Read the current state without changing it. */
	describe(): string;
}

export const WALK_NOT_RUNNING =
	"There is no row-by-row animation on screen right now. The student needs to run a single-table query first.";

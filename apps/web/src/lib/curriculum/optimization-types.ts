export interface IndexSuggestion {
	/** Human label shown on the card, e.g. "Index plays.country". */
	label: string;
	sql: string;
	/** One sentence on why this helps, in the student's language. */
	rationale: string;
}

/**
 * Drives the access-pattern animation. SQLite will not tell us which rows a
 * query touched, so the animation is an honest *illustration* built from the
 * plan shape plus two real numbers: how big the table is, and how many rows the
 * query actually needs. A scan sweeps everything; a seek jumps to the matches.
 */
export interface Illustration {
	table: string;
	totalRows: number;
	/** Counts the rows the query genuinely needs. Measured, never guessed. */
	matchedSql: string;
	/** Precise learner-facing meaning of the matchedSql result. */
	matchedLabel: string;
}

export interface OptimizationProblem {
	id: string;
	title: string;
	/** What the student is being asked to notice. */
	prompt: string;
	sql: string;
	/** The concept this problem teaches; keys into the mastery model. */
	concept: string;
	/** What a good plan looks like once solved, for Sarjy to aim at. */
	goal: string;
	/** One line Sarjy can use to set up the prediction beat. */
	predictHint: string;
	illustration: Illustration;
	/** Indexes that genuinely fix it, plus decoys the student can try. */
	suggestions: IndexSuggestion[];
}

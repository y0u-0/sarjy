export type RewriteFamily =
	| "correlated-subquery"
	| "short-circuit"
	| "projection"
	| "pagination"
	| "sargable"
	| "set-operation"
	| "aggregation";

export interface RewriteChallenge {
	id: string;
	title: string;
	family: RewriteFamily;
	slowSql: string;
	prompt: string;
	nudges: string[];
	solutionSql: string;
	explanation: string;
	measuredSpeedup: number;
	changesResults?: boolean;
	caveat?: string;
}

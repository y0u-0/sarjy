const PREFERRED_NAME_KEYS = new Set([
	"preferred name",
	"nickname",
	"form of address",
	"call me",
	"what to call me",
]);

interface LearnerNameFact {
	key: string;
	value: string;
}

function safeFirstName(name: string): string {
	const first = name.trim().split(/\s+/)[0];
	return first || "there";
}

/** Resolves an explicitly saved form of address without letting memory inject copy. */
export function preferredLearnerName(
	accountName: string,
	facts: LearnerNameFact[],
): string {
	const memory = facts.find((fact) =>
		PREFERRED_NAME_KEYS.has(fact.key.toLowerCase().trim()),
	);
	const candidate = memory?.value.trim().replace(/\s+/g, " ");
	if (
		!candidate ||
		candidate.length > 40 ||
		!/^[-.'\p{L}\p{N} ]+$/u.test(candidate)
	) {
		return safeFirstName(accountName);
	}
	return candidate;
}

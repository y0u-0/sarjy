import { describe, expect, test } from "bun:test";

import {
	type ActiveQueueCandidate,
	type QueueCandidate,
	type QueueConceptEvidence,
	selectQueueCandidate,
} from "./exercise-queue";

const candidates: QueueCandidate[] = [
	{ id: "select-easy", concept: "select", difficulty: 0 },
	{ id: "select-medium", concept: "select", difficulty: 1 },
	{ id: "select-hard", concept: "select", difficulty: 2 },
	{ id: "join-easy", concept: "joins", difficulty: 0 },
	{ id: "join-medium", concept: "joins", difficulty: 1 },
	{ id: "join-hard", concept: "joins", difficulty: 2 },
	{ id: "group-easy", concept: "groups", difficulty: 0 },
	{ id: "group-medium", concept: "groups", difficulty: 1 },
	{ id: "group-hard", concept: "groups", difficulty: 2 },
];

function evidence(
	concept: string,
	overrides: Partial<QueueConceptEvidence> = {},
): QueueConceptEvidence {
	return {
		concept,
		mastery: 0.6,
		opportunities: 3,
		consecutiveFailures: 0,
		explanation: null,
		spokenSignals: [],
		...overrides,
	};
}

function choose(params: {
	active?: ActiveQueueCandidate[];
	assigned?: string[];
	evidence?: QueueConceptEvidence[];
	skipped?: [string, number][];
	recentlyResolved?: string[];
	slot?: number;
}) {
	return selectQueueCandidate({
		candidates,
		assignedIds: new Set(params.assigned ?? []),
		active: params.active ?? [],
		evidence: params.evidence ?? [],
		skippedByConcept: new Map(params.skipped ?? []),
		recentlyResolvedIds: new Set(params.recentlyResolved ?? []),
		slot: params.slot ?? 0,
		random: () => 0,
	});
}

describe("three-card adaptive queue selection", () => {
	test("the first three cards sample three different concepts", () => {
		const active: ActiveQueueCandidate[] = [];
		const assigned: string[] = [];

		for (const slot of [0, 1, 2]) {
			const selection = choose({ active, assigned, slot });
			expect(selection).not.toBeNull();
			if (!selection) throw new Error("expected a candidate");
			assigned.push(selection.candidate.id);
			active.push({ ...selection.candidate, slot });
		}

		expect(new Set(active.map((item) => item.concept)).size).toBe(3);
		expect(active).toHaveLength(3);
	});

	test("repeated failures concentrate the replacement on the weak topic", () => {
		const selection = choose({
			assigned: ["select-hard", "join-easy", "group-easy"],
			active: [
				{ id: "join-easy", concept: "joins", difficulty: 0, slot: 1 },
				{ id: "group-easy", concept: "groups", difficulty: 0, slot: 2 },
			],
			evidence: [
				evidence("select", {
					mastery: 0.2,
					consecutiveFailures: 3,
				}),
				evidence("joins", { mastery: 0.8 }),
				evidence("groups", { mastery: 0.8 }),
			],
		});

		expect(selection?.candidate.concept).toBe("select");
		expect(selection?.candidate.difficulty).toBe(0);
	});

	test("a skipped topic returns in a gentler new shape", () => {
		const selection = choose({
			assigned: ["join-hard", "select-medium", "group-medium"],
			active: [
				{ id: "select-medium", concept: "select", difficulty: 1, slot: 1 },
				{ id: "group-medium", concept: "groups", difficulty: 1, slot: 2 },
			],
			evidence: [evidence("select"), evidence("joins"), evidence("groups")],
			skipped: [["joins", 1]],
		});

		expect(selection?.candidate).toMatchObject({
			concept: "joins",
			difficulty: 0,
		});
		expect(selection?.reason).toContain("skipped");
	});

	test("live confusion matters before the first submission", () => {
		const selection = choose({
			evidence: [
				evidence("joins", {
					opportunities: 0,
					mastery: 0.3,
					spokenSignals: ["reported-confusion"],
				}),
			],
		});

		expect(selection?.candidate).toMatchObject({
			concept: "joins",
			difficulty: 0,
		});
		expect(selection?.reason).toContain("Sarjy");
	});

	test("the latest spoken practice preference wins", () => {
		const moveOn = choose({
			evidence: [
				evidence("select"),
				evidence("joins", {
					spokenSignals: ["requested-more-practice", "requested-to-move-on"],
				}),
				evidence("groups"),
			],
		});
		const more = choose({
			evidence: [
				evidence("select"),
				evidence("joins", {
					spokenSignals: ["requested-to-move-on", "requested-more-practice"],
				}),
				evidence("groups"),
			],
		});

		expect(moveOn?.candidate.concept).not.toBe("joins");
		expect(more?.candidate.concept).toBe("joins");
	});

	test("never puts a third live card from one concept when another exists", () => {
		const selection = choose({
			active: [
				{ id: "select-easy", concept: "select", difficulty: 0, slot: 0 },
				{ id: "select-medium", concept: "select", difficulty: 1, slot: 1 },
			],
			assigned: ["select-easy", "select-medium"],
			evidence: [
				evidence("select", {
					mastery: 0.1,
					consecutiveFailures: 4,
				}),
			],
			slot: 2,
		});

		expect(selection?.candidate.concept).not.toBe("select");
	});

	test("does not immediately recycle the prompt that just resolved", () => {
		const selection = choose({
			active: [
				{ id: "join-easy", concept: "joins", difficulty: 0, slot: 1 },
				{ id: "group-easy", concept: "groups", difficulty: 0, slot: 2 },
			],
			assigned: candidates.map((candidate) => candidate.id),
			recentlyResolved: ["select-easy"],
		});

		expect(selection?.candidate.id).not.toBe("select-easy");
	});
});

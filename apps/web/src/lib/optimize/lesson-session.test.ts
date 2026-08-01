import { describe, expect, test } from "bun:test";

import {
	createOptimizationLesson,
	transitionOptimizationLesson,
} from "./lesson-session";

type Lesson = ReturnType<typeof createOptimizationLesson>;

function interpret(lesson: Lesson, learnerTurn = 1, correct = true) {
	return transitionOptimizationLesson(lesson, {
		type: "record-interpretation",
		response: "It returns one count for plays from Saudi Arabia.",
		correct,
		learnerTurn,
	}).state;
}

function chooseGuidance(lesson: Lesson, learnerTurn = 2) {
	return transitionOptimizationLesson(lesson, {
		type: "choose-guidance",
		mode: "guided",
		learnerTurn,
	}).state;
}

function reachAuthorship() {
	let lesson = chooseGuidance(
		interpret(createOptimizationLesson("idx-country")),
	);
	for (const action of [
		{ type: "reveal-plan" },
		{
			type: "record-observation",
			response: "The scan reads every row before filtering country.",
			correct: true,
			learnerTurn: 3,
		},
		{ type: "reveal-data" },
		{
			type: "record-data-observation",
			response: "Most rows are rejected after the scan reads them.",
			correct: true,
			learnerTurn: 4,
		},
		{
			type: "ask-prediction",
			question: "What work will the index remove?",
			learnerTurn: 4,
		},
		{
			type: "record-prediction",
			response: "It should replace the full scan with a search.",
			learnerTurn: 5,
		},
	] as const) {
		const result = transitionOptimizationLesson(lesson, action);
		expect(result.accepted).toBe(true);
		lesson = result.state;
	}
	return lesson;
}

function reachComparison() {
	const result = transitionOptimizationLesson(reachAuthorship(), {
		type: "apply-change",
		learnerTurn: 6,
	});
	expect(result.accepted).toBe(true);
	return result.state;
}

describe("optimization lesson contract", () => {
	test("keeps the task and guidance locked until the learner interprets the SQL", () => {
		const initial = createOptimizationLesson("idx-country");
		const guidance = transitionOptimizationLesson(initial, {
			type: "choose-guidance",
			mode: "guided",
			learnerTurn: 1,
		});

		expect(initial.checkpoint).toBe("interpret");
		expect(initial.awaitingResponse).toBe("interpretation");
		expect(guidance.accepted).toBe(false);

		const interpreted = transitionOptimizationLesson(initial, {
			type: "record-interpretation",
			response: "It returns one count for Saudi plays.",
			correct: true,
			learnerTurn: 1,
		});
		expect(interpreted.accepted).toBe(true);
		expect(interpreted.state.checkpoint).toBe("orientation");
		expect(interpreted.state.awaitingResponse).toBe("guidance");
	});

	test("keeps an incorrect interpretation on the raw SQL until a fresh aligned answer", () => {
		const initial = createOptimizationLesson("idx-country");
		const incorrect = transitionOptimizationLesson(initial, {
			type: "record-interpretation",
			response: "It lists every Saudi play.",
			correct: false,
			learnerTurn: 1,
		});

		expect(incorrect.accepted).toBe(true);
		expect(incorrect.state.checkpoint).toBe("interpret");
		expect(incorrect.state.awaitingResponse).toBe("interpretation");
		expect(
			transitionOptimizationLesson(incorrect.state, {
				type: "choose-guidance",
				mode: "guided",
				learnerTurn: 2,
			}).accepted,
		).toBe(false);
		expect(
			transitionOptimizationLesson(incorrect.state, {
				type: "record-interpretation",
				response: "It returns one aggregate count, not the matching rows.",
				correct: true,
				learnerTurn: 2,
			}).state.checkpoint,
		).toBe("orientation");
	});

	test("requires a new learner turn before recording every prompted answer", () => {
		const initial = createOptimizationLesson("idx-country");
		const stale = transitionOptimizationLesson(initial, {
			type: "record-interpretation",
			response: "It returns one count for Saudi plays.",
			correct: true,
			learnerTurn: 0,
		});

		expect(stale.accepted).toBe(false);
		expect(stale.state).toEqual(initial);
		expect(stale.message).toContain("new learner answer");

		const interpreted = interpret(initial, 1);
		expect(
			transitionOptimizationLesson(interpreted, {
				type: "choose-guidance",
				mode: "guided",
				learnerTurn: 1,
			}).accepted,
		).toBe(false);
	});

	test("keeps plan evidence hidden until a fresh guidance choice", () => {
		const interpreted = interpret(createOptimizationLesson("idx-country"));
		expect(
			transitionOptimizationLesson(interpreted, { type: "reveal-plan" })
				.accepted,
		).toBe(false);

		const guided = transitionOptimizationLesson(interpreted, {
			type: "choose-guidance",
			mode: "guided",
			learnerTurn: 2,
		});
		expect(guided.accepted).toBe(true);
		expect(
			transitionOptimizationLesson(guided.state, { type: "reveal-plan" })
				.accepted,
		).toBe(true);
	});

	test("respects try-first while guided and show-me unlock one plan reveal", () => {
		const interpreted = interpret(createOptimizationLesson("idx-country"));
		const tryFirst = transitionOptimizationLesson(interpreted, {
			type: "choose-guidance",
			mode: "try-first",
			learnerTurn: 2,
		});
		expect(
			transitionOptimizationLesson(tryFirst.state, { type: "reveal-plan" })
				.accepted,
		).toBe(false);

		for (const mode of ["guided", "show-me"] as const) {
			const chosen = transitionOptimizationLesson(interpreted, {
				type: "choose-guidance",
				mode,
				learnerTurn: 2,
			});
			expect(
				transitionOptimizationLesson(chosen.state, { type: "reveal-plan" })
					.accepted,
			).toBe(true);
		}
	});

	test("keeps an incorrect observation on the same evidence", () => {
		let lesson = chooseGuidance(
			interpret(createOptimizationLesson("idx-country")),
		);
		lesson = transitionOptimizationLesson(lesson, {
			type: "reveal-plan",
		}).state;
		const incorrect = transitionOptimizationLesson(lesson, {
			type: "record-observation",
			response: "The query uses the country index.",
			correct: false,
			learnerTurn: 3,
		});

		expect(incorrect.accepted).toBe(true);
		expect(incorrect.state.checkpoint).toBe("observe");
		expect(incorrect.state.observationRecorded).toBe(false);
		expect(
			transitionOptimizationLesson(incorrect.state, {
				type: "ask-prediction",
				question: "What work changes?",
				learnerTurn: 3,
			}).accepted,
		).toBe(false);
	});

	test("requires plan understanding before showing the real-data animation", () => {
		let lesson = chooseGuidance(
			interpret(createOptimizationLesson("idx-country")),
		);
		lesson = transitionOptimizationLesson(lesson, {
			type: "reveal-plan",
		}).state;
		lesson = transitionOptimizationLesson(lesson, {
			type: "record-observation",
			response: "The full scan reads every play before filtering.",
			correct: true,
			learnerTurn: 3,
		}).state;

		expect(lesson.checkpoint).toBe("observe");
		expect(lesson.awaitingResponse).toBeNull();
		expect(
			transitionOptimizationLesson(lesson, {
				type: "ask-prediction",
				question: "What changes?",
				learnerTurn: 3,
			}).accepted,
		).toBe(false);

		const revealed = transitionOptimizationLesson(lesson, {
			type: "reveal-data",
		});
		expect(revealed.accepted).toBe(true);
		expect(revealed.state.awaitingResponse).toBe("data-observation");
		expect(
			transitionOptimizationLesson(revealed.state, {
				type: "record-data-observation",
				response: "Only matching rows survive.",
				correct: true,
				learnerTurn: 3,
			}).accepted,
		).toBe(false);
	});

	test("enforces every learner beat through final teach-back", () => {
		let lesson = reachComparison();
		for (const action of [
			{
				type: "record-correctness",
				response: "Both versions return the same count.",
				correct: true,
				learnerTurn: 7,
			},
			{
				type: "record-comparison",
				response: "The result matches and the search visits less work.",
				correct: true,
				learnerTurn: 8,
			},
			{ type: "review-alternatives" },
			{
				type: "record-alternative-review",
				response:
					"A composite index only helps if another filtered column is involved.",
				correct: true,
				learnerTurn: 9,
			},
			{ type: "record-teachback", correct: true, learnerTurn: 10 },
		] as const) {
			const result = transitionOptimizationLesson(lesson, action);
			expect(result.accepted).toBe(true);
			lesson = result.state;
		}
		expect(lesson.checkpoint).toBe("complete");
		expect(lesson.awaitingResponse).toBeNull();
	});

	test("prediction unlocks authoring but cannot apply a change in the same turn", () => {
		const lesson = reachAuthorship();
		expect(lesson.awaitingResponse).toBe("change");
		const sameTurn = transitionOptimizationLesson(lesson, {
			type: "apply-change",
			learnerTurn: 5,
		});
		expect(sameTurn.accepted).toBe(false);
		expect(sameTurn.state.changeApplied).toBe(false);

		const learnerSubmitted = transitionOptimizationLesson(lesson, {
			type: "apply-change",
			learnerTurn: 6,
		});
		expect(learnerSubmitted.accepted).toBe(true);
		expect(learnerSubmitted.state.awaitingResponse).toBe("correctness");
	});

	test("requires result correctness before revealing plan and work comparison", () => {
		const lesson = reachComparison();
		expect(lesson.awaitingResponse).toBe("correctness");
		expect(
			transitionOptimizationLesson(lesson, {
				type: "record-comparison",
				response: "The scan changed to a search.",
				correct: true,
				learnerTurn: 7,
			}).accepted,
		).toBe(false);

		const aligned = transitionOptimizationLesson(lesson, {
			type: "record-correctness",
			response: "The before and after result rows match.",
			correct: true,
			learnerTurn: 7,
		});
		expect(aligned.accepted).toBe(true);
		expect(aligned.state.awaitingResponse).toBe("comparison");
	});

	test("requires the learner to align on comparison before alternatives appear", () => {
		const lesson = transitionOptimizationLesson(reachComparison(), {
			type: "record-correctness",
			response: "The answers are equivalent.",
			correct: true,
			learnerTurn: 7,
		}).state;
		const incorrect = transitionOptimizationLesson(lesson, {
			type: "record-comparison",
			response: "It is faster, so the result must be correct.",
			correct: false,
			learnerTurn: 8,
		});
		expect(incorrect.state.checkpoint).toBe("compare");
		expect(incorrect.state.comparisonRecorded).toBe(false);
		expect(
			transitionOptimizationLesson(incorrect.state, {
				type: "review-alternatives",
			}).accepted,
		).toBe(false);
	});

	test("revealing alternatives does not count as learner understanding", () => {
		let lesson = transitionOptimizationLesson(reachComparison(), {
			type: "record-correctness",
			response: "The answers match.",
			correct: true,
			learnerTurn: 7,
		}).state;
		lesson = transitionOptimizationLesson(lesson, {
			type: "record-comparison",
			response: "Same answer, less scanned work.",
			correct: true,
			learnerTurn: 8,
		}).state;
		lesson = transitionOptimizationLesson(lesson, {
			type: "review-alternatives",
		}).state;

		expect(lesson.alternativesRevealed).toBe(true);
		expect(lesson.alternativesReviewed).toBe(false);
		expect(lesson.checkpoint).toBe("alternatives");
		expect(
			transitionOptimizationLesson(lesson, {
				type: "record-teachback",
				correct: true,
				learnerTurn: 9,
			}).accepted,
		).toBe(false);
	});

	test("keeps an incorrect teach-back in place but honors explicit move-on", () => {
		let lesson = reachComparison();
		for (const action of [
			{
				type: "record-correctness",
				response: "The outputs match.",
				correct: true,
				learnerTurn: 7,
			},
			{
				type: "record-comparison",
				response: "The answers match and scanned work fell.",
				correct: true,
				learnerTurn: 8,
			},
			{ type: "review-alternatives" },
			{
				type: "record-alternative-review",
				response: "The extra index is not justified for this filter.",
				correct: true,
				learnerTurn: 9,
			},
			{ type: "record-teachback", correct: false, learnerTurn: 10 },
		] as const) {
			lesson = transitionOptimizationLesson(lesson, action).state;
		}

		expect(lesson.checkpoint).toBe("teachback");
		expect(
			transitionOptimizationLesson(lesson, {
				type: "select-problem",
				problemId: "idx-sort",
				explicitMoveOn: false,
			}).accepted,
		).toBe(false);
		expect(
			transitionOptimizationLesson(lesson, {
				type: "select-problem",
				problemId: "idx-sort",
				explicitMoveOn: true,
			}).state,
		).toEqual(createOptimizationLesson("idx-sort"));
	});

	test("a moved-to problem waits for a new answer after the move request", () => {
		const moved = transitionOptimizationLesson(
			createOptimizationLesson("idx-country"),
			{
				type: "select-problem",
				problemId: "idx-sort",
				explicitMoveOn: true,
				learnerTurn: 12,
			},
		);
		expect(moved.state.responseRequestedAtTurn).toBe(12);
		expect(
			transitionOptimizationLesson(moved.state, {
				type: "record-interpretation",
				response: "An answer from before the new SQL appeared.",
				correct: true,
				learnerTurn: 12,
			}).accepted,
		).toBe(false);
	});
});

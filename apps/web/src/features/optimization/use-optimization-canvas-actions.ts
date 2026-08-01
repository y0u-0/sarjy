import { useCallback } from "react";

import { blockLab } from "@/lib/optimize/lab-controller";
import {
	isLabSurface,
	LAB_SURFACE_LABELS,
	LAB_SURFACES,
	type LabSurface,
} from "@/lib/optimize/surface";

import { measurementSummary } from "./optimization-model";
import type { OptimizationSession } from "./optimization-session";
import type { OptimizationState } from "./use-optimization-state";

interface CanvasActionOptions {
	state: OptimizationState;
	session: OptimizationSession;
	reducedMotion: boolean;
	revealSurface: (surface: LabSurface, note?: string | null) => void;
	loadBaseline: (target: OptimizationState["problem"]) => Promise<string>;
	observe: (message: string) => void;
}

export function useOptimizationCanvasActions(options: CanvasActionOptions) {
	const {
		state,
		session,
		reducedMotion,
		revealSurface,
		loadBaseline,
		observe,
	} = options;
	const describeSurface = useCallback(() => {
		const visible = LAB_SURFACE_LABELS[state.surfaceRef.current];
		const lesson = session.read();
		return `The single teaching canvas is showing ${visible}. Guidance mode: ${lesson.guidance}. Required checkpoint: ${lesson.checkpoint}. The learner can talk and write; Sarjy controls which evidence appears. Available canvas states: ${LAB_SURFACES.join(", ")}.`;
	}, [session, state.surfaceRef]);

	const setSurface = useCallback(
		(nextValue: string, note: string) => {
			let lessonMessage = "";
			if (!isLabSurface(nextValue)) {
				return blockLab(
					`Unknown surface "${nextValue}". Use ${LAB_SURFACES.join(", ")}.`,
				);
			}
			if (
				(nextValue === "plan" || nextValue === "animation") &&
				!state.baselineRef.current
			) {
				return blockLab(
					"The baseline is still being measured. Call lab_explain, then show this surface.",
				);
			}
			if (
				(nextValue === "plan" || nextValue === "animation") &&
				session.read().checkpoint !== "observe"
			) {
				return blockLab(
					"Plan and row evidence belong to the observation step. Keep the current lesson evidence visible and wait for the learner.",
				);
			}
			if (nextValue === "prediction" && !state.predictionRef.current) {
				return blockLab(
					"There is no prediction card yet. Call lab_ask_predict first.",
				);
			}
			if (nextValue === "comparison" && !state.candidateRef.current) {
				return blockLab(
					"There is no candidate measurement yet. Apply the learner's change before showing comparison.",
				);
			}
			if (nextValue === "plan" || nextValue === "animation") {
				const lesson = session.dispatch({
					type: nextValue === "plan" ? "reveal-plan" : "reveal-data",
				});
				if (!lesson.accepted) return blockLab(lesson.message);
				lessonMessage = lesson.message;
			}
			revealSurface(nextValue, note || null);
			if (nextValue === "animation") {
				return `${lessonMessage} The canvas shows measured fixture rows, their kept or rejected status, the real output, and authored SQL-stage counts. STOP HERE. Ask only what the visible operator does to these rows, then wait. Do not mention a fix, index, rewrite, or prediction.`;
			}
			return `The single teaching canvas now shows ${LAB_SURFACE_LABELS[nextValue]}.`;
		},
		[revealSurface, session, state],
	);

	const explain = useCallback(async () => {
		const lesson = session.preview({ type: "reveal-plan" });
		if (!lesson.accepted) return blockLab(lesson.message);
		const current = state.candidate ?? state.baselineRef.current;
		if (!current) {
			const summary = await loadBaseline(state.problemRef.current);
			if (state.baselineRef.current) {
				session.commit(lesson.state);
				revealSurface("plan", "Start with the costly step.");
			}
			return summary;
		}
		session.commit(lesson.state);
		const summary = measurementSummary(current, state.diff);
		revealSurface("plan", "Start with the costly step.");
		observe(summary);
		return summary;
	}, [loadBaseline, observe, revealSurface, session, state]);

	const focusPlanNode = useCallback(
		(nodeId: number, note: string) => {
			if (session.read().checkpoint !== "observe") {
				return blockLab(
					"A plan operator can only be spotlighted during observation. Stay on the current lesson step.",
				);
			}
			const measurement =
				state.candidateRef.current ?? state.baselineRef.current;
			const node = measurement?.plan.flat.find((entry) => entry.id === nodeId);
			if (!measurement || !node) {
				const available = measurement?.plan.flat
					.map((entry) => `#${entry.id} ${entry.label}`)
					.join(", ");
				return blockLab(
					`Plan node #${nodeId} is unavailable.${available ? ` Use ${available}.` : " Measure the plan first."}`,
				);
			}
			const lesson = session.read();
			if (!lesson.planRevealed) {
				const revealed = session.dispatch({ type: "reveal-plan" });
				if (!revealed.accepted) return blockLab(revealed.message);
			}
			state.setFocus({ id: nodeId, note });
			revealSurface(
				"plan",
				note || "Explain what this highlighted operator is doing.",
			);
			const firstRow = measurement.sample?.rows[0];
			const evidence = firstRow
				? ` The actual output sample begins ${Object.entries(firstRow)
						.slice(0, 3)
						.map(([key, value]) => `${key}=${String(value)}`)
						.join(", ")}.`
				: " Row values are unavailable for this operator, so the canvas shows only measured counters.";
			return `Highlighted plan node #${node.id}: ${node.label}. SQLite says ${node.detail}.${evidence} ${note}`;
		},
		[revealSurface, session, state],
	);

	const replayAnimation = useCallback(() => {
		if (session.read().checkpoint !== "observe") {
			return blockLab(
				"The row animation can only replay during observation. Stay on the current lesson step.",
			);
		}
		const current = session.read();
		if (!current.dataRevealed) {
			const lesson = session.dispatch({ type: "reveal-data" });
			if (!lesson.accepted) return blockLab(lesson.message);
		} else if (current.awaitingResponse !== "data-observation") {
			return blockLab(
				"The data observation is already complete. Stay on the current lesson step.",
			);
		}
		state.setReplayKey((key) => key + 1);
		state.setVisualPlayback(reducedMotion ? "complete" : "playing");
		revealSurface("animation", "Follow how much work reaches the useful rows.");
		return reducedMotion
			? "Reduced motion is on, so the completed real-row illustration is shown. STOP HERE. Ask only what happened to the rows, then wait."
			: "Replayed the current real-row illustration. STOP HERE. Ask only what was read, kept, or discarded, then wait. Do not ask for a prediction.";
	}, [reducedMotion, revealSurface, session, state]);

	return {
		describeSurface,
		setSurface,
		explain,
		focusPlanNode,
		replayAnimation,
	};
}

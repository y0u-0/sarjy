import { useEffect, useMemo, useRef } from "react";

import { useTeacher } from "@/components/teacher/teacher-provider";
import type { OptimizationLabProblem } from "@/lib/curriculum/optimization-bank";
import type { LabController } from "@/lib/optimize/lab-controller";

import { problemSql, problemTechnique } from "./optimization-model";

export function useOptimizationTeacherContext(
	problem: OptimizationLabProblem,
	schemaSummary: string,
) {
	const teacher = useTeacher();

	useEffect(() => {
		const summary = `Problem "${problem.title}" (${problem.id}, ${problemTechnique(problem)}): ${problem.prompt} Dataset: ${schemaSummary} Baseline SQL: ${problemSql(problem)} Goal: ${
			problem.mode === "index"
				? problem.goal
				: "Preserve the answer before reducing measured work."
		} Interface: one agent-controlled teaching canvas. Start with dialogue; the learner can only talk and write SQL.`;
		teacher.setScreenContext({
			kind: "optimization",
			title: `Optimization playground: ${problem.title}`,
			summary,
			entityId: problem.id,
			concept: problem.concept,
		});
		return () => teacher.setScreenContext(null);
	}, [teacher.setScreenContext, problem, schemaSummary]);

	return teacher;
}

export function useOptimizationTeacherController(controller: LabController) {
	const teacher = useTeacher();
	const latest = useRef(controller);
	latest.current = controller;
	const stableController = useMemo(
		() =>
			new Proxy({} as LabController, {
				get: (_target, property) => Reflect.get(latest.current, property),
			}),
		[],
	);

	useEffect(() => {
		teacher.registerLab(stableController);
		return () => teacher.registerLab(null);
	}, [stableController, teacher.registerLab]);
}

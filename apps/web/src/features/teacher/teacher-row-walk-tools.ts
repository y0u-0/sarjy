import { WALK_NOT_RUNNING } from "@/lib/optimize/walk-controller";
import { controlRowWalk } from "@/lib/teacher/teacher-surface-control";

import type { TeacherRuntime } from "./teacher-runtime";

export function createTeacherRowWalkTools(runtime: TeacherRuntime) {
	return {
		row_walk: (params: Record<string, unknown>) => {
			const walk = runtime.controllers.getWalk();
			return walk ? controlRowWalk(walk, params) : WALK_NOT_RUNNING;
		},
	};
}

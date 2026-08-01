import type { TeacherClientApi } from "./teacher-client-api";
import { createTeacherLabChangeTools } from "./teacher-lab-change-tools";
import { createTeacherLabFoundationTools } from "./teacher-lab-foundation-tools";
import { createTeacherLearningTools } from "./teacher-learning-tools";
import { createTeacherRowWalkTools } from "./teacher-row-walk-tools";
import type { TeacherRuntime } from "./teacher-runtime";
import { createTeacherSurfaceTools } from "./teacher-surface-tools";
import { createTeacherWeatherTools } from "./teacher-weather-tools";

export type { TeacherClientApi } from "./teacher-client-api";

export function createTeacherClientTools(
	runtime: TeacherRuntime,
	api: TeacherClientApi,
) {
	return {
		...createTeacherWeatherTools(runtime, api),
		...createTeacherSurfaceTools(runtime),
		...createTeacherLearningTools(runtime, api),
		...createTeacherLabFoundationTools(runtime, api),
		...createTeacherLabChangeTools(runtime, api),
		...createTeacherRowWalkTools(runtime),
	};
}

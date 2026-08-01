import { recordAssessmentAttempt } from "./progress-assessment";
import { listProgress } from "./progress-list";
import { recordLiveDataAttempt } from "./progress-live-data";
import { recordOptimizationAttempt } from "./progress-optimization";

export const progressRouter = {
	list: listProgress,
	recordAttempt: recordAssessmentAttempt,
	recordOptimizationAttempt,
	recordLiveDataAttempt,
};

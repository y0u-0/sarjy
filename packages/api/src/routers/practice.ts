import { practiceInsightProcedures } from "./practice-insight-procedures";
import { practiceProfileProcedures } from "./practice-profile-procedures";
import { practiceQueueProcedures } from "./practice-queue-procedures";

export { ATTEMPT_INPUT } from "./practice-input";

export const practiceRouter = {
	...practiceInsightProcedures,
	...practiceQueueProcedures,
	...practiceProfileProcedures,
};

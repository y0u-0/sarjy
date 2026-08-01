export type ProfileView = "learn" | "optimization";

/** The imperative seam between Sarjy's client tools and the mounted profile UI. */
export interface ProfileController {
	describe(): string;
	setView(view: string): string;
	compareSession(sessionId: string): string;
	focusTopic(concept: string, note: string): string;
}

export const PROFILE_NOT_OPEN =
	"The learner profile is not open, so that did nothing. Ask the student to open their Profile first.";

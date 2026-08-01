/**
 * The seam between Sarjy's voice tools and the optimization lab UI.
 *
 * The lab route registers an implementation on mount; the teacher's client tools
 * call it. Keeping this as a plain interface in its own module means the voice
 * layer never imports the route and the route never imports the voice layer, so
 * neither depends on the other's render tree.
 *
 * Every method returns a short string because ElevenLabs sends client-tool
 * results straight back to the model — these are what Sarjy reads to know what
 * the student is now looking at.
 */
export interface LabController {
	selectProblem(
		problemId: string,
		conversationId: string,
		explicitMoveOn: boolean,
		reason: string,
		learnerTurn: number,
	): Promise<string>;
	/** Records what the learner thinks the raw SQL returns before revealing the task. */
	recordInterpretation(
		response: string,
		correct: boolean,
		learnerTurn: number,
	): string;
	/** Records the learner's explicit preference before any teaching visual appears. */
	chooseGuidance(mode: string, reason: string, learnerTurn: number): string;
	/** Records the learner's answer to an observation question. */
	recordObservation(
		response: string,
		correct: boolean,
		learnerTurn: number,
	): string;
	/** Records what the learner understood from the real-data operator animation. */
	recordDataObservation(
		response: string,
		correct: boolean,
		learnerTurn: number,
	): string;
	/** Records the learner's spoken prediction before a measured change. */
	recordPrediction(response: string, learnerTurn: number): string;
	/** Records whether the learner verified that before/after results still agree. */
	recordCorrectness(
		response: string,
		correct: boolean,
		learnerTurn: number,
	): string;
	/** Records the learner's reading of the measured before/after evidence. */
	recordComparison(
		response: string,
		correct: boolean,
		learnerTurn: number,
	): string;
	/** Records whether the learner understands why the shown alternative fits. */
	recordAlternativeReview(
		response: string,
		correct: boolean,
		learnerTurn: number,
	): string;
	/** Reads the single teaching canvas state before the agent changes it. */
	describeSurface(): string;
	/** Morphs the one teaching canvas to the requested evidence. */
	setSurface(surface: string, note: string): string;
	explain(): Promise<string>;
	applyIndex(
		sql: string,
		rationale: string,
		learnerTurn: number,
	): Promise<string>;
	applyRewrite(
		sql: string,
		rationale: string,
		learnerTurn: number,
	): Promise<string>;
	/** Reveals and returns problem-specific alternatives after the measured change. */
	reviewAlternatives(): string;
	resetIndexes(): Promise<string>;
	focusPlanNode(nodeId: number, note: string): string;
	/** Puts a commit-to-a-guess card on screen and waits for nothing. */
	askPredict(question: string, learnerTurn: number): string;
	/** Replays the current real-data operator animation without re-measuring. */
	replayAnimation(): string;
	/** Moves every synchronized visual layer to one authored timeline step. */
	timelineStepTo(index: number): string;
	timelineNext(): string;
	timelinePrevious(): string;
	/** Arms playback for the next agent speech instead of racing ahead of TTS. */
	timelinePlay(): string;
	timelinePause(): string;
	timelineRestart(): string;
	timelineSetSpeed(speed: number): string;
	/** ElevenLabs voice-mode callbacks complete the playback handshake. */
	timelineSpeechStarted(): void;
	timelineSpeechEnded(): void;
	/** Returns the exact active step so narration can describe what is on screen. */
	timelineDescribe(): string;
	/** Stores the agent's teach-back assessment while the session is still live. */
	recordExplanation(
		conversationId: string,
		correct: boolean,
		rationale: string,
		learnerTurn: number,
	): Promise<string>;
}

export const LAB_NOT_OPEN =
	"The student is not on the optimization lab screen, so that did nothing. Ask them to open the Optimization lab first.";

export const LAB_BLOCKED_PREFIX = "BLOCKED:";

export function blockLab(message: string): string {
	return `${LAB_BLOCKED_PREFIX} ${message}`;
}

export function isLabBlocked(result: string): boolean {
	return result.startsWith(LAB_BLOCKED_PREFIX);
}

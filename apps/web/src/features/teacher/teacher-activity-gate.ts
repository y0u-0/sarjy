export const TEACHER_ACTIVITY_INTERVAL_MS = 1_000;

interface TeacherActivityScheduler {
	now: () => number;
	schedule: (callback: () => void, delay: number) => unknown;
	cancel: (handle: unknown) => void;
}

export interface TeacherActivityGate {
	notify: () => void;
	cancel: () => void;
}

const DEFAULT_SCHEDULER: TeacherActivityScheduler = {
	now: Date.now,
	schedule: (callback, delay) => setTimeout(callback, delay),
	cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Sends the first semantic activity immediately and coalesces a continued
 * keystroke burst into at most one trailing SDK call per interval.
 */
export function createTeacherActivityGate(
	send: () => void,
	scheduler: TeacherActivityScheduler = DEFAULT_SCHEDULER,
	intervalMs = TEACHER_ACTIVITY_INTERVAL_MS,
): TeacherActivityGate {
	let lastSentAt: number | null = null;
	let trailingHandle: unknown = null;
	let trailingPending = false;

	const cancel = () => {
		if (trailingHandle !== null) scheduler.cancel(trailingHandle);
		trailingHandle = null;
		trailingPending = false;
		lastSentAt = null;
	};

	const flush = () => {
		trailingHandle = null;
		if (!trailingPending) return;
		trailingPending = false;
		lastSentAt = scheduler.now();
		send();
	};

	const notify = () => {
		const now = scheduler.now();
		if (lastSentAt === null || now - lastSentAt >= intervalMs) {
			cancel();
			lastSentAt = now;
			send();
			return;
		}

		trailingPending = true;
		if (trailingHandle !== null) return;
		trailingHandle = scheduler.schedule(
			flush,
			Math.max(0, intervalMs - (now - lastSentAt)),
		);
	};

	return { notify, cancel };
}

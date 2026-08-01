import type {
	CompareRequest,
	DescribeRequest,
	EngineResponse,
	OptimizeRequest,
	RunRequest,
	SubmitRequest,
	WalkRequest,
} from "./types";
import { SqlEngineError } from "./types";

export type EngineRequestInput =
	| Omit<RunRequest, "id">
	| Omit<SubmitRequest, "id">
	| Omit<DescribeRequest, "id">
	| Omit<OptimizeRequest, "id">
	| Omit<CompareRequest, "id">
	| Omit<WalkRequest, "id">;

interface ScheduledRequest {
	id: number;
	request: EngineRequestInput;
	timeoutMs: number;
	supersedeKey: string | null;
	resolve: (response: EngineResponse) => void;
	reject: (error: SqlEngineError) => void;
	timer: ReturnType<typeof setTimeout> | null;
}

interface SchedulerOptions {
	workerFactory: () => Worker;
	hardTimeoutMs: number;
}

export class SqlRequestScheduler {
	private worker: Worker | null = null;
	private readonly queue: ScheduledRequest[] = [];
	private active: ScheduledRequest | null = null;
	private nextId = 1;

	constructor(private readonly options: SchedulerOptions) {}

	private getWorker(): Worker {
		if (!this.worker) {
			this.worker = this.options.workerFactory();
			this.worker.onmessage = (event: MessageEvent<EngineResponse>) => {
				this.settle(event.data);
			};
		}
		return this.worker;
	}

	private settle(response: EngineResponse): void {
		const entry = this.active;
		if (!entry || entry.id !== response.id) return;
		this.active = null;
		if (entry.timer) clearTimeout(entry.timer);
		if (response.op === "error") {
			entry.reject(new SqlEngineError(response.kind, response.message));
		} else {
			entry.resolve(response);
		}
		this.dispatchNext();
	}

	private timeoutActive(): void {
		const entry = this.active;
		if (!entry) return;
		this.active = null;
		this.worker?.terminate();
		this.worker = null;
		if (entry.timer) clearTimeout(entry.timer);
		entry.reject(
			new SqlEngineError(
				"timeout",
				"Query took too long and the sandbox was restarted.",
			),
		);
		this.dispatchNext();
	}

	private dispatchNext(): void {
		if (this.active) return;
		const entry = this.queue.shift();
		if (!entry) return;
		this.active = entry;
		entry.timer = setTimeout(() => this.timeoutActive(), entry.timeoutMs);
		try {
			this.getWorker().postMessage({ ...entry.request, id: entry.id });
		} catch (error) {
			this.active = null;
			if (entry.timer) clearTimeout(entry.timer);
			entry.reject(
				new SqlEngineError(
					"internal",
					error instanceof Error
						? error.message
						: "SQL worker failed to start.",
				),
			);
			this.dispatchNext();
		}
	}

	private supersede(key: string): void {
		const error = new SqlEngineError("internal", "SQL request was superseded.");
		for (let index = this.queue.length - 1; index >= 0; index -= 1) {
			const entry = this.queue[index];
			if (entry?.supersedeKey !== key) continue;
			this.queue.splice(index, 1);
			entry.reject(error);
		}
		if (this.active?.supersedeKey !== key) return;
		const active = this.active;
		this.active = null;
		if (active.timer) clearTimeout(active.timer);
		this.worker?.terminate();
		this.worker = null;
		active.reject(error);
	}

	cancelScope(key: string): void {
		this.supersede(key);
		this.dispatchNext();
	}

	send<T extends EngineResponse>(
		request: EngineRequestInput,
		timeoutMs: number = this.options.hardTimeoutMs,
		supersedeKey: string | null = null,
	): Promise<T> {
		const id = this.nextId++;
		return new Promise<T>((resolve, reject) => {
			if (supersedeKey) this.supersede(supersedeKey);
			this.queue.push({
				id,
				request,
				timeoutMs,
				supersedeKey,
				resolve: (response) => resolve(response as T),
				reject,
				timer: null,
			});
			this.dispatchNext();
		});
	}

	dispose(): void {
		this.worker?.terminate();
		this.worker = null;
		const error = new SqlEngineError("internal", "SQL sandbox was disposed.");
		if (this.active) {
			if (this.active.timer) clearTimeout(this.active.timer);
			this.active.reject(error);
			this.active = null;
		}
		for (const entry of this.queue.splice(0)) entry.reject(error);
	}
}

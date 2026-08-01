import { describe, expect, test } from "bun:test";

import { SqlEngineClient } from "./client";
import type { EngineResponse } from "./types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class FakeWorker {
	onmessage: ((event: MessageEvent<EngineResponse>) => void) | null = null;
	readonly messages: Array<Record<string, unknown>> = [];
	terminated = false;

	postMessage(message: Record<string, unknown>) {
		this.messages.push(message);
	}

	terminate() {
		this.terminated = true;
	}

	respond(messageIndex: number, response: Omit<EngineResponse, "id">) {
		const request = this.messages[messageIndex];
		this.onmessage?.({
			data: { ...response, id: request?.id },
		} as MessageEvent<EngineResponse>);
	}
}

function createHarness() {
	const workers: FakeWorker[] = [];
	const client = new SqlEngineClient({
		workerFactory: () => {
			const worker = new FakeWorker();
			workers.push(worker);
			return worker as unknown as Worker;
		},
		hardTimeoutMs: 20,
		optimizeTimeoutMs: 200,
	});
	return { client, workers };
}

describe("SqlEngineClient scheduling", () => {
	test("a queued short job does not time out or interrupt an active benchmark", async () => {
		const { client, workers } = createHarness();
		const benchmark = client.optimize("schema", "SELECT 1", { samples: 1 });
		const description = client.describe("other schema");

		expect(workers[0]?.messages.map((message) => message.op)).toEqual([
			"optimize",
		]);
		await wait(35);
		expect(workers[0]?.terminated).toBe(false);

		workers[0]?.respond(0, { op: "optimize" } as Omit<EngineResponse, "id">);
		await benchmark;
		expect(workers[0]?.messages.map((message) => message.op)).toEqual([
			"optimize",
			"describe",
		]);

		workers[0]?.respond(1, {
			op: "describe",
			tables: [],
		} as Omit<EngineResponse, "id">);
		await expect(description).resolves.toEqual([]);
	});

	test("timing out the active job restarts its worker but preserves queued jobs", async () => {
		const { client, workers } = createHarness();
		const run = client.run("schema", "SELECT 1");
		const description = client.describe("queued schema");

		await expect(run).rejects.toMatchObject({ kind: "timeout" });
		expect(workers[0]?.terminated).toBe(true);
		expect(workers).toHaveLength(2);
		expect(workers[1]?.messages.map((message) => message.op)).toEqual([
			"describe",
		]);

		workers[1]?.respond(0, {
			op: "describe",
			tables: [{ name: "items", columns: [], rowCount: 1 }],
		} as Omit<EngineResponse, "id">);
		await expect(description).resolves.toEqual([
			{ name: "items", columns: [], rowCount: 1 },
		]);
	});

	test("description requests for the same DDL share and retain one result", async () => {
		const { client, workers } = createHarness();
		const first = client.describe("same schema");
		const second = client.describe("same schema");

		expect(workers[0]?.messages).toHaveLength(1);
		workers[0]?.respond(0, {
			op: "describe",
			tables: [{ name: "records", columns: [], rowCount: 2 }],
		} as Omit<EngineResponse, "id">);

		expect(await first).toEqual(await second);
		await expect(client.describe("same schema")).resolves.toEqual([
			{ name: "records", columns: [], rowCount: 2 },
		]);
		expect(workers[0]?.messages).toHaveLength(1);
	});

	test("a superseding optimization cancels only the matching active job", async () => {
		const { client, workers } = createHarness();
		const first = client.optimize("schema", "SELECT 1", {
			samples: 1,
			supersedeKey: "optimization-session",
		});
		const unrelated = client.describe("unrelated schema");
		const replacement = client.optimize("schema", "SELECT 2", {
			samples: 1,
			supersedeKey: "optimization-session",
		});

		await expect(first).rejects.toThrow("superseded");
		expect(workers[0]?.terminated).toBe(true);
		expect(workers[1]?.messages.map((message) => message.op)).toEqual([
			"describe",
		]);

		workers[1]?.respond(0, {
			op: "describe",
			tables: [],
		} as Omit<EngineResponse, "id">);
		await unrelated;
		expect(workers[1]?.messages.map((message) => message.op)).toEqual([
			"describe",
			"optimize",
		]);

		workers[1]?.respond(1, {
			op: "optimize",
		} as Omit<EngineResponse, "id">);
		await expect(replacement).resolves.toMatchObject({ op: "optimize" });
	});
});

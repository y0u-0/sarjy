import { env } from "@sarjy-sql/env/server";

import {
	SEMANTIC_COLLECTION,
	SEMANTIC_EMBED_DIMENSIONS,
	SEMANTIC_EMBED_MODEL,
	semanticMemoryEnabled,
} from "./semantic-memory-qdrant";

type Mem0Client = {
	add(
		messages: { role: string; content: string }[],
		options: { userId: string; metadata?: Record<string, unknown> },
	): Promise<unknown>;
};

let mem0Promise: Promise<Mem0Client | null> | null = null;

export async function getSemanticMem0(): Promise<Mem0Client | null> {
	if (!semanticMemoryEnabled()) return null;
	if (mem0Promise) return mem0Promise;
	mem0Promise = (async () => {
		try {
			const mod = (await import("mem0ai/oss")) as unknown as {
				Memory: new (config: unknown) => Mem0Client;
			};
			const url = new URL(env.QDRANT_URL as string);
			return new mod.Memory({
				version: "v1.1",
				historyStore: { provider: "memory", config: {} },
				disableHistory: false,
				embedder: {
					provider: "openai",
					config: {
						apiKey: env.OPENAI_API_KEY,
						model: SEMANTIC_EMBED_MODEL,
					},
				},
				llm: {
					provider: "openai",
					config: { apiKey: env.OPENAI_API_KEY, model: "gpt-4o-mini" },
				},
				vectorStore: {
					provider: "qdrant",
					config: {
						collectionName: SEMANTIC_COLLECTION,
						embeddingModelDims: SEMANTIC_EMBED_DIMENSIONS,
						url: `${url.protocol}//${url.hostname}`,
						port: url.port ? Number(url.port) : 443,
						apiKey: env.QDRANT_API_KEY,
						https: url.protocol === "https:",
					},
				},
			});
		} catch (error) {
			console.error("Mem0 unavailable, falling back to direct writes:", error);
			return null;
		}
	})();
	return mem0Promise;
}

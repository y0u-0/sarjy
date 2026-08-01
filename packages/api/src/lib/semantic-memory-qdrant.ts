import { env } from "@sarjy-sql/env/server";

export const SEMANTIC_COLLECTION = "sarjy_learner_memory";
export const SEMANTIC_EMBED_MODEL = "text-embedding-3-small";
export const SEMANTIC_EMBED_DIMENSIONS = 1536;
const REQUEST_TIMEOUT_MS = 10_000;

export interface QdrantPoint {
	id: string | number;
	score?: number;
	payload?: Record<string, unknown> | null;
}

export function semanticMemoryEnabled(): boolean {
	return Boolean(env.OPENAI_API_KEY && env.QDRANT_URL && env.QDRANT_API_KEY);
}

export async function qdrantRequest<T>(
	path: string,
	init?: RequestInit,
): Promise<T | null> {
	try {
		const base = (env.QDRANT_URL as string).replace(/\/+$/, "");
		const response = await fetch(`${base}${path}`, {
			...init,
			headers: {
				"api-key": env.QDRANT_API_KEY as string,
				"Content-Type": "application/json",
				...init?.headers,
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
		if (!response.ok) {
			console.error(
				`Qdrant ${init?.method ?? "GET"} ${path} failed (${response.status})`,
			);
			return null;
		}
		return (await response.json()) as T;
	} catch (error) {
		console.error(`Qdrant ${path} unreachable:`, error);
		return null;
	}
}

let ready: Promise<boolean> | null = null;

export async function ensureSemanticCollection(): Promise<boolean> {
	if (!semanticMemoryEnabled()) return false;
	if (ready) return ready;
	ready = (async () => {
		const existing = await qdrantRequest<{ result?: unknown }>(
			`/collections/${SEMANTIC_COLLECTION}`,
		);
		if (!existing?.result) {
			const created = await qdrantRequest(
				`/collections/${SEMANTIC_COLLECTION}`,
				{
					method: "PUT",
					body: JSON.stringify({
						vectors: {
							size: SEMANTIC_EMBED_DIMENSIONS,
							distance: "Cosine",
						},
					}),
				},
			);
			if (!created) return false;
		}
		const indexed = (
			await Promise.all(
				["userId", "user_id"].map((field) =>
					qdrantRequest(`/collections/${SEMANTIC_COLLECTION}/index?wait=true`, {
						method: "PUT",
						body: JSON.stringify({
							field_name: field,
							field_schema: "keyword",
						}),
					}),
				),
			)
		).every((result) => result !== null);
		if (!indexed) {
			console.error(
				"Could not ensure the userId payload index; scoped search would fail, so semantic memory stays off.",
			);
			return false;
		}
		return true;
	})();
	return ready;
}

export async function embedSemanticText(
	text: string,
): Promise<number[] | null> {
	try {
		const response = await fetch("https://api.openai.com/v1/embeddings", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ model: SEMANTIC_EMBED_MODEL, input: text }),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
		if (!response.ok) {
			console.error(`Embedding failed (${response.status})`);
			return null;
		}
		const body = (await response.json()) as {
			data?: { embedding?: number[] }[];
		};
		return body.data?.[0]?.embedding ?? null;
	} catch (error) {
		console.error("Embedding unreachable:", error);
		return null;
	}
}

export function semanticPointId(userId: string, text: string): string {
	const seed = `${userId}:${text}`;
	let h1 = 0x811c9dc5;
	let h2 = 0x01000193;
	for (let index = 0; index < seed.length; index += 1) {
		h1 = ((h1 ^ seed.charCodeAt(index)) * 0x01000193) >>> 0;
		h2 = ((h2 + seed.charCodeAt(index) * (index + 1)) * 0x85ebca6b) >>> 0;
	}
	const hex = (h1.toString(16) + h2.toString(16)).padEnd(16, "0").slice(0, 16);
	const tail = hex.repeat(2).slice(0, 16);
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${tail.slice(0, 3)}-8${tail.slice(3, 6)}-${tail.slice(6, 16)}0000`.slice(
		0,
		36,
	);
}

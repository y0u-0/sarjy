import { getSemanticMem0 } from "./semantic-memory-mem0";
import {
	embedSemanticText,
	ensureSemanticCollection,
	type QdrantPoint,
	qdrantRequest,
	SEMANTIC_COLLECTION,
	semanticPointId,
} from "./semantic-memory-qdrant";

const MIN_SCORE = 0.25;

export interface SemanticMemory {
	id: string;
	text: string;
	score: number;
}

export async function rememberSemantic(
	userId: string,
	statement: string,
): Promise<boolean> {
	if (!userId) throw new Error("rememberSemantic requires a userId");
	const text = statement.trim();
	if (!text) return false;
	const mem0 = await getSemanticMem0();
	if (mem0) {
		try {
			await mem0.add([{ role: "user", content: text }], {
				userId,
				metadata: { app: "sarjy" },
			});
			return true;
		} catch (error) {
			console.error("Mem0 write failed, writing directly instead:", error);
		}
	}
	if (!(await ensureSemanticCollection())) return false;
	const vector = await embedSemanticText(text);
	if (!vector) return false;
	const written = await qdrantRequest(
		`/collections/${SEMANTIC_COLLECTION}/points?wait=true`,
		{
			method: "PUT",
			body: JSON.stringify({
				points: [
					{
						id: semanticPointId(userId, text),
						vector,
						payload: { userId, text, createdAt: new Date().toISOString() },
					},
				],
			}),
		},
	);
	return written !== null;
}

export async function recallSemantic(
	userId: string,
	query: string,
	limit = 5,
): Promise<SemanticMemory[]> {
	if (!userId) throw new Error("recallSemantic requires a userId");
	const text = query.trim();
	if (!text || !(await ensureSemanticCollection())) return [];
	const vector = await embedSemanticText(text);
	if (!vector) return [];
	const found = await qdrantRequest<{ result?: QdrantPoint[] }>(
		`/collections/${SEMANTIC_COLLECTION}/points/search`,
		{
			method: "POST",
			body: JSON.stringify({
				vector,
				limit,
				with_payload: true,
				score_threshold: MIN_SCORE,
				filter: { must: [{ key: "userId", match: { value: userId } }] },
			}),
		},
	);
	return (found?.result ?? [])
		.filter((point) => point.payload?.userId === userId)
		.map((point) => ({
			id: String(point.id),
			text: String(point.payload?.text ?? ""),
			score: point.score ?? 0,
		}))
		.filter((memory) => memory.text.length > 0);
}

export async function forgetUser(userId: string): Promise<boolean> {
	if (!userId) throw new Error("forgetUser requires a userId");
	if (!(await ensureSemanticCollection())) return false;
	const deleted = await qdrantRequest(
		`/collections/${SEMANTIC_COLLECTION}/points/delete?wait=true`,
		{
			method: "POST",
			body: JSON.stringify({
				filter: { must: [{ key: "userId", match: { value: userId } }] },
			}),
		},
	);
	return deleted !== null;
}

export async function listRecentSemantic(
	userId: string,
	limit = 12,
): Promise<SemanticMemory[]> {
	if (!userId) throw new Error("listRecentSemantic requires a userId");
	if (!(await ensureSemanticCollection())) return [];
	const found = await qdrantRequest<{ result?: { points?: QdrantPoint[] } }>(
		`/collections/${SEMANTIC_COLLECTION}/points/scroll`,
		{
			method: "POST",
			body: JSON.stringify({
				limit,
				with_payload: true,
				with_vector: false,
				filter: {
					should: [
						{ key: "userId", match: { value: userId } },
						{ key: "user_id", match: { value: userId } },
					],
				},
			}),
		},
	);
	return (found?.result?.points ?? [])
		.filter((point) => {
			const owner = point.payload?.userId ?? point.payload?.user_id;
			return owner === userId;
		})
		.map((point) => ({
			id: String(point.id),
			text: String(point.payload?.data ?? point.payload?.text ?? ""),
			score: 1,
		}))
		.filter((memory) => memory.text.length > 0);
}

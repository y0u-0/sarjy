import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

import { handleEngineRequest } from "./engine-request-handler";
import { cleanSqliteError, isInterruptError } from "./sqlite-runtime";
import type { EngineRequest, EngineResponse } from "./types";

const sqlite3Promise = sqlite3InitModule();

self.onmessage = async (event: MessageEvent<EngineRequest>) => {
	const request = event.data;
	try {
		const sqlite3 = await sqlite3Promise;
		self.postMessage(handleEngineRequest(sqlite3, request));
	} catch (error) {
		const response: EngineResponse = isInterruptError(error)
			? {
					id: request.id,
					op: "error",
					kind: "timeout",
					message: "Query ran too long and was stopped.",
				}
			: {
					id: request.id,
					op: "error",
					kind: "sql-error",
					message:
						error instanceof Error
							? cleanSqliteError(error.message)
							: String(error),
				};
		self.postMessage(response);
	}
};

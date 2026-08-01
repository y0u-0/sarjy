import { LAB_DDL, LAB_SCHEMA_SUMMARY } from "./optimization";
import type { OptimizationDatasetId } from "./optimization-bank-types";
import { PLAYGROUND_DDL, PLAYGROUND_SCHEMA_SUMMARY } from "./playground";

export const optimizationDatasets: Record<
	OptimizationDatasetId,
	{ ddl: string; schemaSummary: string }
> = {
	lab: { ddl: LAB_DDL, schemaSummary: LAB_SCHEMA_SUMMARY },
	"record-shop-large": {
		ddl: PLAYGROUND_DDL,
		schemaSummary: PLAYGROUND_SCHEMA_SUMMARY,
	},
};

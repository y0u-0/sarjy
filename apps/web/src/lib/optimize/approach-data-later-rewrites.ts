import { LATER_REWRITE_ACCESS_APPROACHES } from "./approach-data-later-rewrite-access";
import { LATER_REWRITE_SHAPE_APPROACHES } from "./approach-data-later-rewrite-shapes";
import type { OptimizationApproach } from "./approaches";

export const LATER_REWRITE_APPROACHES: Record<string, OptimizationApproach[]> =
	{
		...LATER_REWRITE_ACCESS_APPROACHES,
		...LATER_REWRITE_SHAPE_APPROACHES,
	};

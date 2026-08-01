import { analysisLessons } from "./expanded-lessons-analysis";
import { CteAndSubqueryLessons } from "./expanded-lessons-cte-subqueries";
import { joinsAndAggregationLessons } from "./expanded-lessons-joins-aggregation";
import { missingAndSetsLessons } from "./expanded-lessons-missing-sets";
import { windowLessons } from "./expanded-lessons-windows";

import type { Lesson } from "./types";

export const expandedLessons: Lesson[] = [
	...missingAndSetsLessons,
	...joinsAndAggregationLessons,
	...CteAndSubqueryLessons,
	...windowLessons,
	...analysisLessons,
];

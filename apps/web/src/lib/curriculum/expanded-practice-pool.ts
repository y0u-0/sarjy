import { advancedAggregationPractice } from "./expanded-practice-advanced-aggregation";
import { businessAnalyticsPractice } from "./expanded-practice-business";
import { correlatedSubqueriesPractice } from "./expanded-practice-correlated-subqueries";
import { dateTextAnalysisPractice } from "./expanded-practice-date-text";
import { nullHandlingPractice } from "./expanded-practice-null-handling";
import { selfJoinsPractice } from "./expanded-practice-self-joins";
import { setOperationsPractice } from "./expanded-practice-set-operations";
import { windowAnalyticsPractice } from "./expanded-practice-window-analytics";
import { windowRankingPractice } from "./expanded-practice-window-ranking";

import type { PoolExercise } from "./types";

type AuthoredExercise = Omit<PoolExercise, "concept">;

export const expandedPracticePool: Record<string, AuthoredExercise[]> = {
	...nullHandlingPractice,
	...setOperationsPractice,
	...selfJoinsPractice,
	...advancedAggregationPractice,
	...correlatedSubqueriesPractice,
	...windowRankingPractice,
	...windowAnalyticsPractice,
	...dateTextAnalysisPractice,
	...businessAnalyticsPractice,
};

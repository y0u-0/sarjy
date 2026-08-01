import type { TimelineVisualPlayback } from "@/lib/optimize/timeline";
import type { StageReport } from "@/lib/sql-engine/query-stages";
import type {
	BenchmarkResult,
	QueryPlan,
	QuerySample,
	WalkResponse,
} from "@/lib/sql-engine/types";

export interface OperatorDataFlowProps {
	plan: QueryPlan | null;
	benchmark: BenchmarkResult | null;
	focusedId: number | null;
	focusNote: string | null;
	walk: WalkResponse | null;
	sample: QuerySample | null;
	stages: StageReport | null;
	matchedRows?: number;
	matchedLabel?: string;
	replayKey: number;
	playback: TimelineVisualPlayback;
	className?: string;
}

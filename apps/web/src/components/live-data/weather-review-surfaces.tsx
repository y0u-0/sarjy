import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";
import { cn } from "@sarjy-sql/ui/lib/utils";
import {
	ChartNoAxesCombined,
	CheckCircle2,
	TableProperties,
} from "lucide-react";

import type { QueryPlan, SubmitResponse } from "@/lib/sql-engine/types";

import { PlanTree } from "../optimize/plan-tree";
import { ResultsTable } from "../results-table";
import { WeatherEvidenceFrame } from "./weather-evidence-frame";
import { WeatherTrendChart } from "./weather-trend-chart";

export function WeatherChartSurface({
	mission,
	note,
}: {
	mission: WeatherMission;
	note: string | null;
}) {
	return (
		<WeatherEvidenceFrame
			surface="chart"
			label="trend"
			icon={<ChartNoAxesCombined className="size-3.5" />}
			note={note}
		>
			<WeatherTrendChart
				rows={mission.chartRows}
				startDate={mission.period.startDate}
				endDate={mission.period.endDate}
			/>
		</WeatherEvidenceFrame>
	);
}

export function WeatherResultSurface({
	submission,
	note,
}: {
	submission: SubmitResponse | null;
	note: string | null;
}) {
	return (
		<WeatherEvidenceFrame
			surface="result"
			label="query result"
			icon={<CheckCircle2 className="size-3.5" />}
			note={note}
		>
			{submission && (
				<div className="space-y-4">
					<div
						className={cn(
							"rounded-2xl border px-4 py-3 text-sm",
							submission.grade.pass
								? "border-lime/50 bg-lime/10"
								: "border-tangerine/50 bg-tangerine/10",
						)}
					>
						<p className="font-semibold">
							{submission.grade.pass ? "Exact match" : "Not yet"}
						</p>
						<p className="mt-1 text-muted-foreground">
							{submission.grade.message}
						</p>
					</div>
					<ResultsTable result={submission.result} />
				</div>
			)}
		</WeatherEvidenceFrame>
	);
}

export function WeatherPlanSurface({
	plan,
	note,
}: {
	plan: QueryPlan | null;
	note: string | null;
}) {
	return (
		<WeatherEvidenceFrame
			surface="plan"
			label="query plan"
			icon={<TableProperties className="size-3.5" />}
			note={note}
		>
			<PlanTree plan={plan} />
		</WeatherEvidenceFrame>
	);
}

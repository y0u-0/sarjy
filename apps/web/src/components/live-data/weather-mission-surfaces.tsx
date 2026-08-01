import type { WeatherMission } from "@sarjy-sql/api/lib/weather-mission";
import { cn } from "@sarjy-sql/ui/lib/utils";
import {
	CloudSun,
	Database,
	LoaderCircle,
	MessageCircleMore,
	Sparkles,
} from "lucide-react";

import type { WeatherLessonState } from "@/lib/live-data/weather-lesson";

import { WeatherEvidenceFrame } from "./weather-evidence-frame";
import { WeatherSourceRows } from "./weather-source-rows";

export function EmptyWeatherMission({ loading }: { loading: boolean }) {
	if (loading) {
		return (
			<div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
				<LoaderCircle className="size-5 animate-spin text-periwinkle" />
				Freezing a real weather snapshot…
			</div>
		);
	}

	return (
		<WeatherEvidenceFrame
			surface="question"
			label="start with a place"
			icon={<MessageCircleMore className="size-3.5" />}
			note={null}
		>
			<div className="flex min-h-72 flex-col items-center justify-center text-center">
				<div className="flex size-16 items-center justify-center rounded-3xl bg-periwinkle/10 text-periwinkle">
					<CloudSun className="size-8" />
				</div>
				<h2 className="mt-5 font-extrabold text-2xl tracking-tight">
					Which cities matter to you?
				</h2>
				<p className="mt-2 max-w-lg text-muted-foreground text-sm leading-relaxed">
					Tell Sarjy one to three cities. She’ll fetch a bounded historical
					snapshot and choose the SQL challenge that fits where you are.
				</p>
				<p className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 font-mono text-xs">
					<MessageCircleMore className="size-3.5 text-lime" /> “Compare Riyadh
					and London”
				</p>
			</div>
		</WeatherEvidenceFrame>
	);
}

export function WeatherQuestionSurface({
	mission,
	lesson,
	note,
}: {
	mission: WeatherMission;
	lesson: WeatherLessonState;
	note: string | null;
}) {
	return (
		<WeatherEvidenceFrame
			surface="question"
			label="mission"
			icon={<Sparkles className="size-3.5" />}
			note={note}
		>
			<p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.1em]">
				{mission.period.startDate} → {mission.period.endDate} ·{" "}
				{mission.observationCount.toLocaleString()} hourly rows
			</p>
			<h2 className="mt-3 font-extrabold text-3xl tracking-tight">
				{mission.challenge.title}
			</h2>
			<p className="mt-3 max-w-3xl text-base leading-relaxed">
				{mission.challenge.prompt}
			</p>
			<div
				className={cn(
					"mt-6 rounded-2xl border p-4",
					lesson.prediction
						? "border-lime/40 bg-lime/10"
						: "border-border bg-ink-soft",
				)}
			>
				<p className="font-semibold text-xs uppercase tracking-[0.08em]">
					Prediction
				</p>
				<p className="mt-1 text-muted-foreground text-sm">
					{lesson.prediction ?? mission.challenge.predictionPrompt}
				</p>
			</div>
		</WeatherEvidenceFrame>
	);
}

export function WeatherDataSurface({
	mission,
	note,
}: {
	mission: WeatherMission;
	note: string | null;
}) {
	return (
		<WeatherEvidenceFrame
			surface="data"
			label="source rows"
			icon={<Database className="size-3.5" />}
			note={note}
		>
			<p className="mb-4 text-muted-foreground text-sm leading-relaxed">
				These sample rows combine each city from{" "}
				<code className="font-mono text-foreground">locations</code> with its
				measurements from{" "}
				<code className="font-mono text-foreground">weather_hourly</code>. Use
				the database guide to choose the exact columns for your query.
			</p>
			<WeatherSourceRows rows={mission.previewRows} />
		</WeatherEvidenceFrame>
	);
}

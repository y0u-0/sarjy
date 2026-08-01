import { MessageCircle } from "lucide-react";

import type { OptimizationLabProblem } from "@/lib/curriculum/optimization-bank";

import { problemSql, type VoicePrediction } from "./optimization-model";

export function BaselineLoadingSurface() {
	return (
		<div
			className="space-y-3"
			role="status"
			aria-label="Measuring the baseline"
		>
			<div className="h-4 w-40 rounded bg-foreground/10 motion-safe:animate-pulse" />
			<div className="h-24 rounded-2xl bg-foreground/5 motion-safe:animate-pulse" />
			<p className="text-muted-foreground text-xs">
				SQLite is measuring the original plan and real row flow…
			</p>
		</div>
	);
}

export function PredictionSurface({
	prediction,
}: {
	prediction: VoicePrediction;
}) {
	return (
		<div className="py-4 sm:py-8">
			<p className="font-semibold text-[10px] text-lime uppercase tracking-[0.1em]">
				{prediction.response ? "Prediction locked" : "Your prediction"}
			</p>
			<p className="max-w-3xl font-bold text-2xl leading-tight tracking-tight sm:text-3xl">
				{prediction.question}
			</p>
			{prediction.response ? (
				<blockquote className="mt-3 border-lime border-l-2 pl-3 text-foreground/90 text-sm leading-relaxed">
					“{prediction.response}”
				</blockquote>
			) : (
				<p className="mt-3 flex items-center gap-2 text-muted-foreground text-sm">
					<MessageCircle className="size-4 text-lime" /> Answer Sarjy out loud.
					She will wait before revealing what SQLite did.
				</p>
			)}
		</div>
	);
}

export function WorkspaceSurface({
	problem,
}: {
	problem: OptimizationLabProblem;
}) {
	return (
		<div>
			<pre className="overflow-x-auto rounded-2xl border border-border bg-ink p-4 font-mono text-[12px] text-foreground leading-relaxed">
				{problemSql(problem)}
			</pre>
		</div>
	);
}

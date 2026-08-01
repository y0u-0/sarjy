import { Gauge } from "lucide-react";

export function OptimizationLessonHeader({
	taskRevealed,
}: {
	taskRevealed: boolean;
}) {
	return (
		<header className="mb-4 flex flex-wrap items-start gap-3 border-border border-b pb-4">
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<Gauge className="size-4 text-periwinkle" />
					<p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
						Sarjy’s optimization lesson
					</p>
					<span className="rounded-full border border-lime/35 bg-lime/8 px-2 py-0.5 font-mono text-[10px] text-lime">
						agent controlled
					</span>
				</div>
				<h1 className="mt-1 font-bold text-xl tracking-tight">
					{taskRevealed ? "Investigate this query" : "Read the SQL first"}
				</h1>
				<p className="mt-1 max-w-[68ch] text-muted-foreground text-sm leading-relaxed">
					Talk to Sarjy. She controls the evidence; you only explain and write
					SQL.
				</p>
			</div>
		</header>
	);
}

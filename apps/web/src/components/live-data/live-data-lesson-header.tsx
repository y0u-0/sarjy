import { CloudSun, Sparkles } from "lucide-react";

export function LiveDataLessonHeader() {
	return (
		<header className="flex flex-wrap items-start justify-between gap-4">
			<div>
				<div className="inline-flex items-center gap-2 rounded-full border border-periwinkle/30 bg-periwinkle/10 px-3 py-1 font-mono text-periwinkle text-xs">
					<CloudSun className="size-3.5" />
					Live data mission
				</div>
				<h1 className="mt-4 max-w-3xl font-black text-4xl tracking-[-0.04em] sm:text-6xl">
					Ask a real question.
					<br />
					<span className="text-muted-foreground">
						Interrogate the evidence.
					</span>
				</h1>
			</div>
			<div className="rounded-2xl border border-border bg-card px-3 py-2 text-muted-foreground text-xs">
				<span className="inline-flex items-center gap-1.5 text-foreground">
					<Sparkles className="size-3.5 text-lime" /> Sarjy controls the lesson
				</span>
				<p className="mt-1">You only talk, predict, and write SQL.</p>
			</div>
		</header>
	);
}

import {
	ArrowRight,
	Check,
	MessageCircleQuestion,
	Mic,
	Sparkles,
} from "lucide-react";

import type { useTeacher } from "@/components/teacher/teacher-provider";

export function StartingPointInterview({
	teacher,
}: {
	teacher: ReturnType<typeof useTeacher>;
}) {
	const connected = teacher.status === "connected";
	const connecting = teacher.status === "connecting";

	return (
		<div className="h-full overflow-y-auto p-4 sm:p-7 lg:p-10">
			<div className="mx-auto max-w-5xl">
				<div className="inline-flex items-center gap-2 rounded-full border border-periwinkle/40 bg-periwinkle/10 px-3 py-1 font-mono text-periwinkle text-xs">
					<Sparkles className="size-3.5" />
					Your starting point
				</div>
				<h1 className="mt-4 max-w-3xl font-black text-4xl tracking-[-0.04em] sm:text-6xl">
					Three quick questions.
					<br />
					<span className="text-muted-foreground">
						Then three SQL questions.
					</span>
				</h1>
				<p className="mt-5 max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg">
					Sarjy will ask about what you have used—not how you sound—and place
					your first set near that level. Your real SQL work takes over from
					there.
				</p>

				<section className="mt-9 max-w-2xl">
					<div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
						<div className="flex size-12 items-center justify-center rounded-2xl border border-ink bg-periwinkle text-ink">
							<MessageCircleQuestion className="size-6" />
						</div>
						<h2 className="mt-5 font-extrabold text-2xl tracking-tight">
							A two-minute chat with Sarjy
						</h2>
						<ul className="mt-5 space-y-3 text-muted-foreground text-sm">
							{[
								"Your experience with SQL",
								"Which query ideas feel familiar",
								"One short scenario at your level",
							].map((item) => (
								<li key={item} className="flex items-center gap-3">
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lime/15 text-lime">
										<Check className="size-3.5" />
									</span>
									{item}
								</li>
							))}
						</ul>
						<button
							type="button"
							onClick={() => void teacher.start()}
							disabled={connected || connecting}
							className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border border-ink bg-lime px-5 font-bold text-ink transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-default disabled:opacity-70"
						>
							<Mic className="size-4" />
							{connecting
								? "Connecting…"
								: connected
									? "Interview in progress"
									: "Start the interview"}
							{!connected && !connecting && <ArrowRight className="size-4" />}
						</button>
					</div>
				</section>
			</div>
		</div>
	);
}

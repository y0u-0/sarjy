import { MessageCircle } from "lucide-react";

function EvidenceItem({ title, body }: { title: string; body: string }) {
	return (
		<div>
			<p className="font-semibold text-xs">{title}</p>
			<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
				{body}
			</p>
		</div>
	);
}

export function ProfileIntroduction() {
	return (
		<>
			<header>
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="font-extrabold text-2xl tracking-tight">
							Where you stand
						</h1>
						<p className="mt-1 max-w-xl text-muted-foreground text-sm leading-relaxed">
							Built from every query you've submitted. If something looks wrong,
							talk it through with Sarjy — this is the same evidence she sees.
						</p>
					</div>
					<MessageCircle className="mt-1 size-5 shrink-0 text-periwinkle" />
				</div>
			</header>

			<section className="mt-6 rounded-2xl border border-border bg-card p-5">
				<h2 className="font-bold text-sm">How Sarjy adapts</h2>
				<div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
					<EvidenceItem
						title="What you submit"
						body="Correctness, mistakes, help used, and repeated transfer problems estimate each topic."
					/>
					<EvidenceItem
						title="What you explain"
						body="Teach-backs and explicit requests can keep a topic in practice or let it move on."
					/>
					<EvidenceItem
						title="What you prefer"
						body="Your stated preferences change pacing and presentation, never the bar for understanding."
					/>
				</div>
				<p className="mt-3 text-muted-foreground text-xs leading-relaxed">
					Sarjy does not infer a fixed “learning style,” ability, mood, or
					emotion from your voice or behavior.
				</p>
			</section>
		</>
	);
}

import { Button } from "@sarjy-sql/ui/components/button";
import { cn } from "@sarjy-sql/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BarChart3,
	GraduationCap,
	ScanLine,
	Table2,
} from "lucide-react";

const METRICS = [
	{
		value: "207",
		label: "authored exercises",
		className: "bg-lime sm:col-span-7",
	},
	{
		value: "3",
		label: "visible at once",
		className: "bg-amber sm:col-span-5",
	},
	{
		value: "19",
		label: "measured optimization labs",
		className: "bg-periwinkle sm:col-span-5",
	},
	{
		value: "29",
		label: "profile directions",
		className: "bg-cream sm:col-span-7",
	},
] as const;

export function LandingOutro() {
	return (
		<section className="mx-auto max-w-6xl px-5 py-20 sm:px-7 sm:py-28">
			<div
				className="grid gap-px overflow-hidden rounded-3xl border border-ink bg-ink sm:grid-cols-12"
				data-landing-reveal="scale"
			>
				{METRICS.map((metric) => (
					<div
						key={metric.label}
						className={cn("p-6 sm:p-8", metric.className)}
					>
						<p className="font-black font-mono text-6xl tracking-[-0.06em]">
							{metric.value}
						</p>
						<p className="mt-2 font-semibold text-xs uppercase tracking-[0.08em]">
							{metric.label}
						</p>
					</div>
				))}
			</div>

			<div
				className="relative mt-16 overflow-hidden rounded-[2rem] border border-ink bg-lime p-7 sm:p-10"
				data-landing-reveal="up"
			>
				<div className="absolute -top-8 right-[10%] size-28 rotate-12 rounded-3xl border border-ink bg-amber" />
				<div className="absolute -right-6 -bottom-8 size-32 rounded-full border border-ink bg-periwinkle" />
				<div className="relative max-w-3xl">
					<p className="font-mono text-[11px] uppercase tracking-[0.14em]">
						Your teacher is ready when you are
					</p>
					<h2 className="mt-4 text-balance font-black text-5xl leading-[0.98] tracking-[-0.05em] sm:text-7xl sm:leading-[0.94]">
						One teacher. With you all the way.
					</h2>
					<div className="mt-8 flex flex-wrap items-center gap-3">
						<Button
							size="lg"
							nativeButton={false}
							className="landing-cta group h-12 border-ink bg-ink px-7 text-cream hover:rounded-xl hover:bg-cream hover:text-ink"
							render={<Link to="/learn" />}
						>
							Meet Sarjy
							<ArrowRight data-icon="inline-end" />
						</Button>
						<p className="font-mono text-[10px] text-ink/55 uppercase tracking-[0.1em]">
							It starts learning from your first query
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

export function LandingFooter() {
	return (
		<footer className="border-ink border-t bg-ink px-5 py-7 text-cream">
			<div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 font-semibold text-sm">
					<GraduationCap className="size-4 text-lime" /> Sarjy
				</div>
				<div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-cream/40 uppercase tracking-[0.1em]">
					<span className="flex items-center gap-1.5">
						<Table2 className="size-3" /> real SQLite
					</span>
					<span className="flex items-center gap-1.5">
						<ScanLine className="size-3" /> measured feedback
					</span>
					<span className="flex items-center gap-1.5">
						<BarChart3 className="size-3" /> visible progress
					</span>
				</div>
			</div>
		</footer>
	);
}

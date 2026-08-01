import { Button } from "@sarjy-sql/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CloudSun, Gauge } from "lucide-react";

import { LiveDataDemo, OptimizationDemo } from "../demos/product-demos";

export function LiveDataSection() {
	return (
		<section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-7 sm:py-28 lg:grid-cols-[minmax(0,0.82fr)_minmax(26rem,1.18fr)] lg:gap-16">
			<div data-landing-reveal="left">
				<div className="inline-flex items-center gap-2 rounded-full border border-ink bg-periwinkle px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">
					<CloudSun className="size-3.5" />A lesson from the real world
				</div>
				<h2 className="mt-5 text-balance font-black text-5xl leading-[0.98] tracking-[-0.05em] sm:text-7xl sm:leading-[0.94]">
					Name the cities. Sarjy builds the lesson.
				</h2>
				<p className="mt-5 max-w-md text-pretty text-ink/60 text-sm leading-relaxed sm:text-base">
					Pick up to three places you care about. Sarjy freezes a bounded
					Open-Meteo historical snapshot into SQLite, asks for your prediction,
					checks your query, then reveals the data, chart, and plan only when
					they help the explanation.
				</p>
				<Button
					variant="outline"
					nativeButton={false}
					className="landing-cta group mt-7 border-ink text-ink hover:rounded-xl hover:bg-ink hover:text-cream"
					render={<Link to="/learn/live-data" />}
				>
					Try a live-data mission
					<ArrowRight data-icon="inline-end" />
				</Button>
			</div>
			<div data-landing-reveal="right">
				<LiveDataDemo />
			</div>
		</section>
	);
}

export function OptimizationSection() {
	return (
		<section className="border-ink border-y bg-ink text-cream">
			<div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-7 sm:py-28 lg:grid-cols-[minmax(0,0.8fr)_minmax(26rem,1.2fr)] lg:gap-16">
				<div data-landing-reveal="left">
					<div className="inline-flex items-center gap-2 rounded-full border border-periwinkle/40 bg-periwinkle/10 px-3 py-1 font-mono text-[10px] text-periwinkle uppercase tracking-[0.12em]">
						<Gauge className="size-3.5" />
						The same teacher goes deeper
					</div>
					<h2 className="mt-5 text-balance font-black text-5xl leading-[0.98] tracking-[-0.05em] sm:text-7xl sm:leading-[0.94]">
						It learns how you think about speed.
					</h2>
					<p className="mt-5 max-w-md text-pretty text-cream/55 text-sm leading-relaxed sm:text-base">
						Nineteen labs cover single, multiple, and composite indexes, query
						rewrites, subqueries, CTAS, and plan trade-offs. Sarjy controls the
						step-by-step comparison while SQLite measures the work.
					</p>
					<Button
						variant="outline"
						nativeButton={false}
						className="landing-cta group mt-7 border-cream/35 text-cream hover:rounded-xl hover:border-lime hover:bg-lime hover:text-ink"
						render={<Link to="/learn/optimize" />}
					>
						Learn optimization
						<ArrowRight data-icon="inline-end" />
					</Button>
				</div>
				<div data-landing-reveal="right">
					<OptimizationDemo />
				</div>
			</div>
		</section>
	);
}

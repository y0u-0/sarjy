import { cn } from "@sarjy-sql/ui/lib/utils";
import { ArrowRight, CloudSun, Gauge } from "lucide-react";

import { TinyLabel } from "../landing-primitives";

const SCAN_CELLS = Array.from({ length: 84 }, (_, index) => index);

export function OptimizationDemo() {
	return (
		<div className="relative overflow-hidden rounded-[1.75rem] border border-cream/16 bg-ink-soft p-4 sm:p-5">
			<div className="flex flex-wrap items-center gap-2">
				<span className="rounded-full border border-tangerine/50 bg-tangerine/10 px-2.5 py-1 font-mono text-[10px] text-tangerine uppercase">
					Before · scan
				</span>
				<ArrowRight className="size-3.5 text-cream/30" />
				<span className="rounded-full border border-lime/50 bg-lime/10 px-2.5 py-1 font-mono text-[10px] text-lime uppercase">
					After · search
				</span>
			</div>

			<div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
				<div>
					<p className="font-mono text-[10px] text-cream/40 uppercase tracking-[0.12em]">
						full-scan steps
					</p>
					<div className="mt-1 flex items-baseline gap-2 font-black tracking-[-0.05em]">
						<span className="text-4xl text-tangerine line-through decoration-2 sm:text-5xl">
							59,999
						</span>
						<ArrowRight className="size-5 text-cream/35" />
						<span className="text-5xl text-lime sm:text-6xl">0</span>
					</div>
				</div>
				<Gauge className="size-9 text-periwinkle" />
			</div>

			<div className="mt-5 grid grid-cols-12 gap-1" aria-hidden>
				{SCAN_CELLS.map((cell) => (
					<span
						key={cell}
						className={cn(
							"landing-scan-cell h-2 rounded-[2px]",
							cell < 10 ? "bg-lime" : "bg-tangerine/55",
						)}
						style={{ animationDelay: `${cell * 12}ms` }}
					/>
				))}
			</div>

			<div className="mt-5 grid gap-2 sm:grid-cols-2">
				<div className="rounded-2xl border border-tangerine/35 bg-tangerine/5 p-3">
					<p className="font-bold text-tangerine text-xs">Full table scan</p>
					<p className="mt-1 font-mono text-[10px] text-cream/45">
						SCAN plays · temp sort
					</p>
				</div>
				<div className="rounded-2xl border border-lime/35 bg-lime/5 p-3">
					<p className="font-bold text-lime text-xs">Index search</p>
					<p className="mt-1 font-mono text-[10px] text-cream/45">
						SEARCH plays USING INDEX
					</p>
				</div>
			</div>
		</div>
	);
}

export function LiveDataDemo() {
	return (
		<div className="overflow-hidden rounded-[1.75rem] border border-ink bg-ink p-4 text-cream shadow-[8px_8px_0_0_#b9ff66] sm:p-5">
			<div className="flex items-center justify-between border-cream/12 border-b pb-3">
				<div>
					<TinyLabel>Frozen Open-Meteo snapshot</TinyLabel>
					<p className="mt-1 font-extrabold text-xl tracking-tight">
						Riyadh ↔ London
					</p>
				</div>
				<CloudSun className="size-6 text-periwinkle" />
			</div>

			<div className="mt-4 rounded-2xl border border-cream/12 bg-cream/5 p-4">
				<div className="flex items-center justify-between gap-2">
					<p className="font-mono text-[9px] text-cream/45 uppercase tracking-[0.1em]">
						Daily average °C
					</p>
					<div className="flex items-center gap-3 font-mono text-[9px] text-cream/55">
						<span className="inline-flex items-center gap-1">
							<span className="size-1.5 rounded-full bg-lime" /> Riyadh
						</span>
						<span className="inline-flex items-center gap-1">
							<span className="size-1.5 rounded-full bg-periwinkle" /> London
						</span>
					</div>
				</div>
				<svg
					viewBox="0 0 520 170"
					className="mt-3 h-auto w-full"
					role="img"
					aria-label="Illustration of two city temperature trends"
				>
					{[25, 70, 115, 160].map((y) => (
						<line
							key={y}
							x1="8"
							y1={y}
							x2="512"
							y2={y}
							stroke="currentColor"
							strokeOpacity="0.1"
						/>
					))}
					<polyline
						points="10,54 92,43 174,48 256,30 338,38 420,20 510,31"
						fill="none"
						stroke="#b9ff66"
						strokeWidth="4"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<polyline
						points="10,126 92,136 174,110 256,121 338,96 420,107 510,83"
						fill="none"
						stroke="#7a78ff"
						strokeWidth="4"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>

			<div className="mt-3 grid grid-cols-4 gap-1.5 font-mono text-[9px]">
				{["predict", "query", "chart", "teach back"].map((step, index) => (
					<span
						key={step}
						className={cn(
							"rounded-lg border px-2 py-2 text-center uppercase",
							index === 2
								? "border-lime bg-lime text-ink"
								: "border-cream/15 text-cream/45",
						)}
					>
						{step}
					</span>
				))}
			</div>
		</div>
	);
}

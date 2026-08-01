import type { ReactNode } from "react";

import type { WeatherSurface } from "@/lib/live-data/weather-controller";

export function WeatherEvidenceFrame({
	surface,
	label,
	icon,
	children,
	note,
}: {
	surface: WeatherSurface;
	label: string;
	icon: ReactNode;
	children: ReactNode;
	note: string | null;
}) {
	return (
		<section className="animate-stamp" data-live-data-surface={surface}>
			<div className="mb-5 flex flex-wrap items-center gap-2">
				<span className="inline-flex items-center gap-1.5 rounded-full border border-periwinkle/30 bg-periwinkle/10 px-2.5 py-1 font-semibold text-[10px] text-periwinkle uppercase tracking-[0.1em]">
					{icon}
					{label}
				</span>
				{note && <p className="text-muted-foreground text-xs">{note}</p>}
			</div>
			{children}
		</section>
	);
}

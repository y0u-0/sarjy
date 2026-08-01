import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

interface AuthCardProps {
	title: string;
	subtitle: string;
	children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
	return (
		<div className="flex h-full items-center justify-center bg-ink p-5">
			<div className="w-full max-w-md animate-rise rounded-3xl border border-ink bg-cream p-8 text-ink shadow-[4px_4px_0_0_rgba(199,255,105,0.35)]">
				<span className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-3.5 py-1.5 font-semibold text-cream text-xs">
					<GraduationCap className="size-3.5 text-lime" />
					Sarjy
				</span>
				<h1 className="mt-5 font-extrabold text-3xl tracking-tight">{title}</h1>
				<p className="mt-1.5 text-ink/60 text-sm">{subtitle}</p>
				<div className="mt-7">{children}</div>
			</div>
		</div>
	);
}

export const authFieldLabelClass =
	"font-semibold text-ink/70 text-xs uppercase tracking-[0.08em]";

export const authInputClass =
	"border-ink/25 text-ink placeholder:text-ink/35 focus-visible:border-ink focus-visible:ring-lime/60";

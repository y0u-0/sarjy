import { Button } from "@sarjy-sql/ui/components/button";
import { cn } from "@sarjy-sql/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap } from "lucide-react";
import type { RefObject } from "react";

import { TeacherPresenceDemo } from "../demos/teacher-presence-demo";

const LOOP_ITEMS = [
	"three questions at a time",
	"real SQL runs",
	"voice + submissions",
	"Sarjy moves the screen",
	"the next problem adapts",
] as const;

export function LandingNavigation() {
	return (
		<nav className="landing-nav relative z-40 border-ink/10 border-b bg-cream">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-7">
				<Link
					to="/"
					className="landing-logo flex items-center gap-2 rounded-full border border-ink bg-ink px-4 py-2 font-semibold text-cream text-sm"
				>
					<GraduationCap className="size-4 text-lime" />
					Sarjy
				</Link>
				<div className="flex items-center gap-2">
					<Link
						to="/login"
						className="relative hidden py-2 font-semibold text-sm after:absolute after:right-0 after:bottom-1 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100 sm:block"
					>
						Sign in
					</Link>
					<Button
						size="sm"
						nativeButton={false}
						className="landing-cta group h-10 hover:rounded-xl"
						render={<Link to="/learn" />}
					>
						Meet Sarjy
						<ArrowRight data-icon="inline-end" />
					</Button>
				</div>
			</div>
		</nav>
	);
}

export function LandingHero({
	heroTiltRef,
}: {
	heroTiltRef: RefObject<HTMLDivElement | null>;
}) {
	return (
		<>
			<header className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-20 sm:px-7 sm:pt-24 lg:grid-cols-[minmax(0,0.86fr)_minmax(29rem,1.14fr)] lg:gap-16 lg:pt-28 lg:pb-28">
				<div>
					<p className="landing-hero-eyebrow font-mono text-[11px] text-ink/55 uppercase tracking-[0.16em]">
						Your always-there SQL teacher
					</p>
					<h1 className="mt-5 max-w-2xl font-black text-[clamp(3.2rem,6vw,5rem)] leading-[0.94] tracking-[-0.055em] sm:leading-[0.92]">
						<span className="landing-title-line">
							<span className="landing-title-line-inner">A teacher</span>
						</span>
						<span className="landing-title-line">
							<span className="landing-title-line-inner [animation-delay:70ms]">
								that learns
							</span>
						</span>
						<span className="landing-title-line">
							<span className="landing-title-line-inner [animation-delay:140ms]">
								how you{" "}
								<span className="relative inline-block">
									learn.
									<span className="landing-hero-underline absolute right-0 -bottom-1 left-0 -z-0 h-[0.18em] -rotate-1 bg-lime" />
								</span>
							</span>
						</span>
					</h1>
					<p className="landing-hero-copy mt-7 max-w-md text-pretty text-base text-ink/65 leading-relaxed sm:text-lg">
						Sarjy sees the query you submit, the result it produced, what you
						predicted, and how you explain it. Only three questions stay
						visible; each replacement is chosen from that evidence.
					</p>
					<div className="landing-hero-actions mt-8 flex flex-wrap items-center gap-3">
						<Button
							size="lg"
							nativeButton={false}
							className="landing-cta group h-12 px-7 hover:rounded-xl"
							render={<Link to="/learn" />}
						>
							Start with Sarjy
							<ArrowRight data-icon="inline-end" />
						</Button>
						<span className="font-mono text-[10px] text-ink/45 uppercase tracking-[0.12em]">
							sees the work · adapts the teaching
						</span>
					</div>
				</div>

				<div className="landing-hero-enter">
					<div ref={heroTiltRef} className="landing-hero-tilt">
						<TeacherPresenceDemo />
					</div>
				</div>
			</header>

			<div className="overflow-hidden border-ink border-y bg-ink py-3.5">
				<div className="flex w-max animate-marquee items-center gap-8 pr-8">
					{[...LOOP_ITEMS, ...LOOP_ITEMS].map((item, index) => (
						<div key={`${item}-${index}`} className="flex items-center gap-8">
							<span
								className={cn(
									"whitespace-nowrap font-mono text-xs uppercase tracking-[0.12em]",
									index % 3 === 0
										? "text-lime"
										: index % 3 === 1
											? "text-cream/70"
											: "text-periwinkle",
								)}
							>
								{item}
							</span>
							<ArrowRight className="size-3 text-cream/20" />
						</div>
					))}
				</div>
			</div>
		</>
	);
}

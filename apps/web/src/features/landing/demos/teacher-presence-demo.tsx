import { cn } from "@sarjy-sql/ui/lib/utils";
import { Eye } from "lucide-react";

import { SarjyOrb } from "@/components/teacher/sarjy-orb";

import {
	ORB_INPUT,
	ORB_OUTPUT,
	TinyLabel,
	useLandingTeacherBeat,
} from "../landing-primitives";

export function TeacherPresenceDemo() {
	const teacherBeat = useLandingTeacherBeat();
	const observations = [
		{ label: "Prediction", value: "confident", tone: "text-lime" },
		{ label: "Submission", value: "rows multiplied", tone: "text-tangerine" },
		{ label: "Teach-back", value: "not checked", tone: "text-amber" },
	] as const;

	return (
		<div className="relative mx-auto w-full max-w-xl">
			<div className="landing-presence-sticker absolute -top-5 -right-2 z-10 rotate-2 rounded-xl border border-ink bg-amber px-3 py-2 font-bold font-mono text-[10px] text-ink uppercase tracking-[0.1em] sm:right-5">
				Present for every step
			</div>
			<div className="overflow-hidden rounded-[1.75rem] border border-ink bg-ink p-3 shadow-[8px_8px_0_0_#7a78ff] sm:p-4">
				<div className="flex items-center justify-between border-cream/12 border-b px-1 pb-3 text-cream">
					<div className="flex items-center gap-2.5">
						<div className="landing-orb-presence size-14 shrink-0">
							<SarjyOrb
								state={teacherBeat.state}
								getInputVolume={ORB_INPUT}
								getOutputVolume={ORB_OUTPUT}
								className="size-full"
							/>
						</div>
						<div>
							<TinyLabel>Your personal SQL teacher</TinyLabel>
							<p
								key={teacherBeat.status}
								className="landing-orb-state-copy mt-0.5 font-extrabold text-lg tracking-tight"
							>
								Sarjy is {teacherBeat.status}
							</p>
						</div>
					</div>
					<span className="inline-flex items-center gap-1.5 rounded-full border border-lime/35 bg-lime/10 px-2.5 py-1 font-mono text-[10px] text-lime">
						<span className="landing-presence-dot size-1.5 rounded-full bg-lime" />
						{teacherBeat.status}
					</span>
				</div>

				<div className="mt-3 grid gap-2.5 sm:grid-cols-[minmax(0,1.12fr)_minmax(11.5rem,0.88fr)]">
					<div className="relative min-h-56 overflow-hidden rounded-2xl border border-cream/14 bg-ink-soft p-4 text-cream">
						<div className="flex items-center justify-between">
							<TinyLabel>Live workspace</TinyLabel>
							<Eye className="size-4 text-lime" />
						</div>
						<pre className="mt-6 overflow-hidden font-mono text-[11px] leading-6 sm:text-xs">
							<span className="text-periwinkle">SELECT</span> a.title, t.name
							{"\n"}
							<span className="text-periwinkle">FROM</span> albums a{"\n"}
							<span className="text-periwinkle">JOIN</span> tracks t{"\n"}
							{"  "}
							<span className="text-periwinkle">ON</span> a.id = t.album_id
							<span className="ml-0.5 inline-block h-3 w-1.5 animate-caret bg-lime align-middle" />
						</pre>
						<div className="absolute right-3 bottom-3 left-3 flex items-center gap-2 rounded-xl border border-tangerine/35 bg-tangerine/10 px-3 py-2">
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tangerine font-black text-[10px] text-ink">
								6×
							</span>
							<p className="font-mono text-[9px] text-cream/60">
								rows multiplied after the join
							</p>
						</div>
					</div>

					<div className="rounded-2xl border border-cream/14 bg-cream/5 p-3 text-cream">
						<div className="flex items-center justify-between px-1">
							<TinyLabel>What Sarjy notices</TinyLabel>
							<span className="font-mono text-[9px] text-cream/35">now</span>
						</div>
						<div className="mt-3 grid gap-2">
							{observations.map((item, index) => (
								<div
									key={item.label}
									className="landing-observation rounded-xl border border-cream/10 bg-ink-soft px-3 py-2.5"
									style={{ animationDelay: `${160 + index * 180}ms` }}
								>
									<p className="font-mono text-[9px] text-cream/35 uppercase">
										{item.label}
									</p>
									<p className={cn("mt-0.5 font-bold text-xs", item.tone)}>
										{item.value}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="landing-teaching-move mt-3 rounded-2xl border border-lime/35 bg-lime/10 p-3 text-cream">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 size-12 shrink-0">
							<SarjyOrb
								state={teacherBeat.state}
								getInputVolume={ORB_INPUT}
								getOutputVolume={ORB_OUTPUT}
								className="size-full"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<TinyLabel>Live with Sarjy</TinyLabel>
								<div
									className="landing-orb-wave"
									data-talking={teacherBeat.state === "talking"}
									aria-hidden
								>
									{[0, 1, 2, 3, 4].map((bar) => (
										<span
											key={bar}
											style={{ animationDelay: `${bar * 70}ms` }}
										/>
									))}
								</div>
							</div>
							<p
								key={teacherBeat.line}
								className="landing-orb-state-copy mt-1 font-bold text-sm"
							>
								{teacherBeat.line}
							</p>
							<p
								key={teacherBeat.detail}
								className="landing-orb-state-copy mt-1 font-mono text-[9px] text-cream/45"
							>
								{teacherBeat.detail}
							</p>
						</div>
					</div>
					<div className="mt-3 grid grid-cols-3 gap-1.5 font-mono text-[9px]">
						<span className="landing-teaching-mode rounded-lg border border-lime bg-lime px-2 py-1.5 text-center text-ink">
							show it
						</span>
						<span className="rounded-lg border border-cream/15 px-2 py-1.5 text-center text-cream/40">
							talk it out
						</span>
						<span className="rounded-lg border border-cream/15 px-2 py-1.5 text-center text-cream/40">
							try again
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

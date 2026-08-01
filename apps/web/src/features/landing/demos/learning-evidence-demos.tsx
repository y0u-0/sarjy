import { cn } from "@sarjy-sql/ui/lib/utils";
import { Check, GraduationCap, Mic2, Play } from "lucide-react";

import { TinyLabel } from "../landing-primitives";

export function QueryEvidenceDemo() {
	const rows = [
		{ id: 1, genre: "Rock", state: "kept" },
		{ id: 2, genre: "Ambient", state: "rejected" },
		{ id: 3, genre: "Rock", state: "kept" },
		{ id: 4, genre: "Folk", state: "rejected" },
	] as const;

	return (
		<div className="grid overflow-hidden rounded-2xl border border-cream/14 bg-ink text-cream sm:grid-cols-[minmax(0,1.25fr)_minmax(180px,0.75fr)]">
			<div className="border-cream/12 border-b p-4 sm:border-r sm:border-b-0">
				<div className="flex items-center justify-between">
					<TinyLabel>Real SQLite · browser worker</TinyLabel>
					<span className="flex size-7 items-center justify-center rounded-full border border-cream/20">
						<Play className="size-3 fill-lime text-lime" />
					</span>
				</div>
				<pre className="mt-5 overflow-x-auto font-mono text-[12px] leading-6">
					<span className="text-periwinkle">SELECT</span> title, price{"\n"}
					<span className="text-periwinkle">FROM</span> albums{"\n"}
					<span className="text-periwinkle">WHERE</span> genre ={" "}
					<span className="text-amber">'Rock'</span>
					<span className="ml-0.5 inline-block h-3 w-1.5 animate-caret bg-lime align-middle" />
				</pre>
				<div className="mt-5 flex items-center gap-2">
					<span className="rounded-full border border-lime bg-lime px-3 py-1 font-bold text-[10px] text-ink uppercase">
						Run
					</span>
					<span className="rounded-full border border-cream/20 px-3 py-1 font-mono text-[10px] text-cream/55">
						Cmd ↵
					</span>
				</div>
			</div>

			<div className="p-3">
				<div className="flex items-center justify-between px-1">
					<TinyLabel>Rows, explained</TinyLabel>
					<span className="font-mono text-[9px] text-cream/40">2 kept</span>
				</div>
				<div className="mt-3 grid gap-1.5">
					{rows.map((row, index) => (
						<div
							key={row.id}
							className={cn(
								"landing-result-row flex items-center gap-2 rounded-lg border px-2.5 py-2 font-mono text-[10px]",
								row.state === "kept"
									? "border-lime/50 bg-lime/10"
									: "border-cream/10 text-cream/35 line-through",
							)}
							style={{ animationDelay: `${index * 180}ms` }}
						>
							<span className="w-4 text-cream/35">{row.id}</span>
							<span>{row.genre}</span>
							{row.state === "kept" && (
								<Check className="ml-auto size-3 text-lime" />
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export function ConfidenceDemo() {
	return (
		<div className="relative min-h-52 overflow-hidden rounded-3xl border border-ink bg-amber p-5 text-ink">
			<TinyLabel>Before the answer</TinyLabel>
			<p className="mt-3 max-w-xs font-extrabold text-2xl leading-[1.08] tracking-tight">
				Call it first.
			</p>
			<p className="mt-2 max-w-xs text-ink/65 text-sm">
				Sarjy learns the gap between what worked and what you expected.
			</p>
			<div className="absolute right-4 bottom-4 left-4 flex gap-2">
				<span className="flex-1 rounded-full border border-ink bg-ink px-3 py-2 text-center font-semibold text-cream text-xs">
					I've got this
				</span>
				<span className="flex-1 rounded-full border border-ink bg-cream/55 px-3 py-2 text-center font-semibold text-xs">
					Not sure
				</span>
			</div>
		</div>
	);
}

export function TeacherControlDemo() {
	return (
		<div className="relative min-h-52 overflow-hidden rounded-3xl border border-ink bg-periwinkle p-5 text-ink">
			<div className="flex items-center justify-between">
				<TinyLabel>Voice + screen</TinyLabel>
				<Mic2 className="size-4" />
			</div>
			<p className="mt-3 max-w-[13rem] font-extrabold text-2xl leading-[1.08] tracking-tight">
				Point. Replay. Explain.
			</p>
			<div className="absolute right-4 bottom-4 left-4 rounded-2xl border border-ink bg-cream p-3">
				<div className="flex items-center gap-2">
					<div className="flex size-7 items-center justify-center rounded-full border border-ink bg-periwinkle">
						<GraduationCap className="size-3.5" />
					</div>
					<p className="font-semibold text-xs">Show me row 4 again.</p>
					<div className="ml-auto flex h-5 items-center gap-0.5">
						{["0ms", "120ms", "240ms"].map((delay) => (
							<span
								key={delay}
								className="w-1 animate-eq-bar rounded-full bg-ink"
								style={{ animationDelay: delay }}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

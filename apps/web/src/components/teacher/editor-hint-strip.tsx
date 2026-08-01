import { cn } from "@sarjy-sql/ui/lib/utils";
import { Lightbulb, Sparkles, Wand2, X } from "lucide-react";

import {
	type HintLevel,
	type TeacherHint,
	useTeacherSelector,
} from "./teacher-provider";

const LEVEL_STYLES: Record<HintLevel, { bg: string; Icon: typeof Lightbulb }> =
	{
		nudge: { bg: "bg-sky", Icon: Sparkles },
		hint: { bg: "bg-amber", Icon: Lightbulb },
		solution: { bg: "bg-lime-soft", Icon: Wand2 },
	};

function Key({ children }: { children: string }) {
	return (
		<kbd className="rounded border border-ink/30 bg-cream/60 px-1 font-mono text-[10px]">
			{children}
		</kbd>
	);
}

export function EditorHintStrip() {
	const hint = useTeacherSelector((teacher) => teacher.hint);
	const dismissHint = useTeacherSelector((teacher) => teacher.dismissHint);

	if (!hint) return null;

	const { bg, Icon } = LEVEL_STYLES[hint.level];

	return (
		<div
			className={cn(
				"absolute inset-x-0 bottom-0 z-10 flex animate-stamp items-center gap-2 border-ink/25 border-t px-3 py-1.5 text-ink",
				bg,
			)}
		>
			<Icon className="size-3.5 shrink-0" />
			<p className="min-w-0 flex-1 truncate text-xs">
				<span className="font-bold">{hint.title}</span>
				{hint.body ? <span className="text-ink/75"> · {hint.body}</span> : null}
			</p>
			{hint.sql && (
				<span className="hidden shrink-0 items-center gap-1.5 text-[10px] text-ink/70 sm:flex">
					<Key>Tab</Key> use it
					<Key>Esc</Key> keep mine
				</span>
			)}
			<button
				type="button"
				onClick={() => dismissHint("dismissed")}
				aria-label="Dismiss hint"
				className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 hover:bg-ink/10"
			>
				<X className="size-3" />
			</button>
		</div>
	);
}

export type { TeacherHint };

import { Button } from "@sarjy-sql/ui/components/button";
import { Trash2 } from "lucide-react";

import type { VisibleMemoryFact } from "./profile-model";

function MemoryFactRow({
	fact,
	disabled,
	onForget,
}: {
	fact: VisibleMemoryFact;
	disabled: boolean;
	onForget: (id: number) => void;
}) {
	return (
		<li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
			<div className="min-w-0">
				<p className="font-semibold text-xs capitalize">{fact.key}</p>
				<p className="mt-0.5 break-words text-sm">{fact.value}</p>
				<p className="mt-1 text-[11px] text-muted-foreground">
					{fact.source === "agent"
						? "Saved from your conversation"
						: `Derived estimate · ${Math.round(fact.confidence * 100)}% confidence`}
				</p>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="size-8 shrink-0 text-muted-foreground hover:text-tangerine"
				disabled={disabled}
				onClick={() => onForget(fact.id)}
				aria-label={`Forget ${fact.key}`}
			>
				<Trash2 className="size-3.5" />
			</Button>
		</li>
	);
}

export function MemoryLedger({
	facts,
	pending,
	error,
	forgetting,
	onForget,
}: {
	facts: VisibleMemoryFact[];
	pending: boolean;
	error: boolean;
	forgetting: boolean;
	onForget: (id: number) => void;
}) {
	return (
		<section className="mt-3 rounded-2xl border border-border bg-card p-5">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="font-bold text-sm">What Sarjy remembers</h2>
				<span className="text-muted-foreground text-xs">
					{facts.length} saved
				</span>
			</div>
			{pending && (
				<p className="mt-3 text-muted-foreground text-sm">
					Reading your memory ledger…
				</p>
			)}
			{error && (
				<p className="mt-3 text-sm text-tangerine">
					Couldn’t load saved memories right now.
				</p>
			)}
			{!pending && !error && facts.length === 0 && (
				<p className="mt-3 text-muted-foreground text-sm leading-relaxed">
					Nothing saved yet. Tell Sarjy a durable goal or how you want an
					explanation presented, and it can appear here.
				</p>
			)}
			{facts.length > 0 && (
				<ul className="mt-3 divide-y divide-border">
					{facts.map((fact) => (
						<MemoryFactRow
							key={fact.id}
							fact={fact}
							disabled={forgetting}
							onForget={onForget}
						/>
					))}
				</ul>
			)}
			<p className="mt-3 text-muted-foreground text-xs">
				Tell Sarjy a correction to update it, or remove it here.
			</p>
		</section>
	);
}

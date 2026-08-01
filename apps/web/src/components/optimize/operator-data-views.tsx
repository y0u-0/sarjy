import { cn } from "@sarjy-sql/ui/lib/utils";
import type { ReactNode } from "react";

import type { OperatorVisualKind } from "@/lib/optimize/operator-visual";
import type {
	QuerySample,
	WalkResponse,
	WalkRow,
} from "@/lib/sql-engine/types";

import {
	formatOperatorValue,
	OperatorDataRow,
	ResultRows,
} from "./operator-data-row";

interface RowsViewProps {
	kind: OperatorVisualKind;
	sample: QuerySample | null;
	sourceRows: WalkRow[];
	columns: string[];
	matched: Set<number>;
	walk: WalkResponse | null;
	revealed: number;
}

export function OperatorRowsView(props: RowsViewProps) {
	if (props.kind === "sort" && props.sample)
		return <SortRows {...props} sample={props.sample} />;
	if (props.walk?.join && props.kind === "join")
		return <JoinRows walk={props.walk} revealed={props.revealed} />;
	if (props.sourceRows.length > 0) {
		return (
			<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4">
				{props.sourceRows.map((row, index) => (
					<OperatorDataRow
						key={row.rowid}
						values={row.cells}
						columns={props.columns}
						state={
							props.matched.size === 0 || props.matched.has(row.rowid)
								? "kept"
								: "dropped"
						}
						visible={index < props.revealed}
					/>
				))}
			</div>
		);
	}
	if (props.sample)
		return <ResultRows sample={props.sample} revealed={props.revealed} />;
	return (
		<p className="text-muted-foreground text-xs leading-relaxed">
			This operator exposes measured work but not row values. Sarjy can still
			walk its exact counters and plan detail without inventing an internal
			trace.
		</p>
	);
}

function SortRows(props: RowsViewProps & { sample: QuerySample }) {
	return (
		<div className="space-y-3">
			<div>
				<Label>Rows arrive from the table</Label>
				<div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
					{props.sourceRows.slice(0, 6).map((row) => (
						<OperatorDataRow
							key={row.rowid}
							values={row.cells}
							columns={props.columns}
							state="neutral"
							visible
						/>
					))}
				</div>
			</div>
			<div className="flex items-center gap-2" aria-hidden>
				<span className="h-px flex-1 bg-border" />
				<span className="font-mono text-[10px] text-amber uppercase">
					temporary sort buffer
				</span>
				<span className="h-px flex-1 bg-border" />
			</div>
			<div>
				<Label accent>Actual output order</Label>
				<ResultRows sample={props.sample} revealed={props.revealed} />
			</div>
		</div>
	);
}

function JoinRows({
	walk,
	revealed,
}: {
	walk: WalkResponse;
	revealed: number;
}) {
	return (
		<div className="space-y-1.5">
			{walk.join?.pairs.slice(0, 8).map((pair, index) => {
				const left = walk.join?.leftRows.find((row) => row.rowid === pair.left);
				const right = walk.join?.rightRows.find(
					(row) => row.rowid === pair.right,
				);
				return (
					<div
						key={`${pair.left}-${pair.right}-${index}`}
						className={cn(
							"grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2 transition-[transform,opacity] duration-200",
							index < revealed ? "opacity-100" : "translate-y-1 opacity-0",
						)}
					>
						<PairValue
							value={
								left ? (Object.values(left.cells)[0] ?? left.rowid) : pair.left
							}
						/>
						<span className="h-px bg-lime" />
						<PairValue
							value={
								right
									? (Object.values(right.cells)[0] ?? right.rowid)
									: "no match"
							}
						/>
					</div>
				);
			})}
		</div>
	);
}

function PairValue({
	value,
}: {
	value: Parameters<typeof formatOperatorValue>[0];
}) {
	return (
		<p className="truncate rounded-lg bg-ink px-2 py-1.5 font-mono text-[10px]">
			{formatOperatorValue(value)}
		</p>
	);
}
function Label({
	children,
	accent = false,
}: {
	children: ReactNode;
	accent?: boolean;
}) {
	return (
		<p
			className={cn(
				"mb-1.5 font-semibold text-[10px] uppercase tracking-[0.08em]",
				accent ? "text-lime" : "text-muted-foreground",
			)}
		>
			{children}
		</p>
	);
}

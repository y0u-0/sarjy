import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { WalkController } from "@/lib/optimize/walk-controller";
import type { WalkResponse } from "@/lib/sql-engine/types";

import {
	formatTableCell,
	TABLE_WALK_SPEEDS,
	type TableRowState,
} from "./table-walkthrough-model";

export function useTableWalkthrough(
	walk: WalkResponse,
	replayKey: number,
	onRegister?: (controller: WalkController | null) => void,
) {
	const [cursor, setCursor] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [speedIndex, setSpeedIndex] = useState(1);
	const reducedMotion = useReducedMotion();
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const total = walk.rows.length;
	const matched = useMemo(
		() => new Set(walk.matchedRowids),
		[walk.matchedRowids],
	);
	const clear = useCallback(() => {
		if (timer.current !== null) clearTimeout(timer.current);
		timer.current = null;
	}, []);

	useEffect(() => {
		void replayKey;
		clear();
		setCursor(reducedMotion ? total : 0);
		setPlaying(!reducedMotion);
	}, [clear, reducedMotion, replayKey, total]);
	useEffect(() => {
		clear();
		if (reducedMotion || !playing || cursor >= total) return;
		timer.current = setTimeout(
			() => setCursor((value) => value + 1),
			TABLE_WALK_SPEEDS[speedIndex].ms,
		);
		return clear;
	}, [clear, cursor, playing, reducedMotion, speedIndex, total]);

	const done = cursor >= total;
	const keptSoFar = walk.rows
		.slice(0, cursor)
		.filter((row) => matched.has(row.rowid));
	const stateFor = (index: number, rowid: number): TableRowState => {
		if (index > cursor) return "pending";
		if (index === cursor && !done) return "testing";
		return matched.has(rowid) ? "kept" : "rejected";
	};
	const describeRow = useCallback(
		(index: number) => {
			const row = walk.rows[index];
			if (!row) return "That row does not exist.";
			const values = walk.columns
				.map(
					(column) => `${column}=${formatTableCell(row.cells[column] ?? null)}`,
				)
				.join(", ");
			return `Row ${index + 1} of ${total}: ${values}. It ${matched.has(row.rowid) ? "SURVIVES" : "is REJECTED by"} the predicate${walk.where ? ` (WHERE ${walk.where})` : ""}.`;
		},
		[matched, total, walk],
	);

	useEffect(() => {
		if (!onRegister) return;
		const go = (index: number) => {
			setPlaying(false);
			setCursor(index);
			return describeRow(index);
		};
		const controller: WalkController = {
			stepTo: (row) => go(Math.max(0, Math.min(total - 1, row - 1))),
			next: () => go(cursor >= total ? 0 : Math.min(total - 1, cursor + 1)),
			previous: () => go(cursor >= total ? total - 1 : Math.max(0, cursor - 1)),
			play: () => {
				if (reducedMotion)
					return "Reduced motion is on. Use next and previous for discrete steps.";
				setPlaying(true);
				return "Playing the walkthrough.";
			},
			pause: () => {
				setPlaying(false);
				return `Paused. ${describeRow(Math.min(cursor, total - 1))}`;
			},
			restart: () => {
				setCursor(0);
				setPlaying(!reducedMotion);
				return reducedMotion
					? `Reduced motion is on; paused at the first row. ${describeRow(0)}`
					: "Restarted the walkthrough from the first row.";
			},
			describe: () => {
				const kept = walk.rows
					.slice(0, cursor)
					.filter((row) => matched.has(row.rowid)).length;
				const position =
					cursor >= total
						? `Finished: ${matched.size} of ${total} rows survived.`
						: `Currently on ${describeRow(cursor)}`;
				return `Table ${walk.table}, ${total} rows on screen, ${playing ? "playing" : "paused"}. ${kept} kept so far. ${position}`;
			},
		};
		onRegister(controller);
		return () => onRegister(null);
	}, [
		cursor,
		describeRow,
		matched,
		onRegister,
		playing,
		reducedMotion,
		total,
		walk,
	]);

	return {
		cursor,
		setCursor,
		playing,
		setPlaying,
		speedIndex,
		setSpeedIndex,
		reducedMotion,
		total,
		matched,
		done,
		keptSoFar,
		stateFor,
		columns: walk.projected.length > 0 ? walk.projected : walk.columns,
	};
}

export type TableWalkthroughModel = ReturnType<typeof useTableWalkthrough>;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { WalkController } from "@/lib/optimize/walk-controller";
import type { JoinWalk } from "@/lib/sql-engine/types";

import { JOIN_SPEEDS, summariseJoinRow } from "./join-walkthrough-model";

export function useJoinWalkthrough(
	join: JoinWalk,
	replayKey: number,
	onRegister?: (controller: WalkController | null) => void,
) {
	const [cursor, setCursor] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [speedIndex, setSpeedIndex] = useState(1);
	const reducedMotion = useReducedMotion();
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const total = join.pairs.length;
	const leftById = useMemo(
		() => new Map(join.leftRows.map((row) => [row.rowid, row])),
		[join.leftRows],
	);
	const rightById = useMemo(
		() => new Map(join.rightRows.map((row) => [row.rowid, row])),
		[join.rightRows],
	);
	const producing = useMemo(
		() =>
			new Set(
				join.pairs
					.filter((pair) => pair.right !== null)
					.map((pair) => pair.left),
			),
		[join.pairs],
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
	}, [replayKey, clear, reducedMotion, total]);
	useEffect(() => {
		clear();
		if (reducedMotion || !playing || cursor >= total) return;
		timer.current = setTimeout(
			() => setCursor((value) => value + 1),
			JOIN_SPEEDS[speedIndex].ms,
		);
		return clear;
	}, [clear, cursor, playing, reducedMotion, speedIndex, total]);

	const done = cursor >= total;
	const activePair = done ? null : join.pairs[cursor];
	const emitted = join.pairs.slice(0, done ? total : cursor);
	const matchIndex = activePair
		? join.pairs
				.slice(0, cursor)
				.filter((pair) => pair.left === activePair.left).length
		: 0;
	const describeStep = useCallback(
		(index: number) => {
			const pair = join.pairs[index];
			if (!pair) return "That step does not exist.";
			const left = leftById.get(pair.left);
			const right = pair.right === null ? null : rightById.get(pair.right);
			const leftText = left
				? summariseJoinRow(left, join.leftColumns)
				: `rowid ${pair.left}`;
			const repeats = join.pairs
				.slice(0, index)
				.filter((entry) => entry.left === pair.left).length;
			const fanNote =
				repeats > 0
					? ` This is match number ${repeats + 1} for the SAME ${join.leftTable} row — the join is multiplying it.`
					: "";
			if (!right)
				return `Step ${index + 1} of ${total}: ${join.leftTable} row "${leftText}" matched NOTHING in ${join.rightTable}. A ${join.kind === "left" ? "LEFT JOIN keeps it with NULLs" : "plain JOIN would drop it entirely"}.${fanNote}`;
			return `Step ${index + 1} of ${total}: ${join.leftTable} "${leftText}" paired with ${join.rightTable} "${summariseJoinRow(right, join.rightColumns)}".${fanNote}`;
		},
		[join, leftById, rightById, total],
	);

	useEffect(() => {
		if (!onRegister) return;
		const go = (index: number) => {
			setPlaying(false);
			setCursor(index);
			return describeStep(index);
		};
		const controller: WalkController = {
			stepTo: (row) => go(Math.max(0, Math.min(total - 1, row - 1))),
			next: () => go(cursor >= total ? 0 : Math.min(total - 1, cursor + 1)),
			previous: () => go(cursor >= total ? total - 1 : Math.max(0, cursor - 1)),
			play: () => {
				if (reducedMotion) {
					return "Reduced motion is on. Use next and previous for discrete join steps.";
				}
				setPlaying(true);
				return "Playing the join walkthrough.";
			},
			pause: () => {
				setPlaying(false);
				return `Paused. ${describeStep(Math.min(cursor, total - 1))}`;
			},
			restart: () => {
				setCursor(0);
				setPlaying(!reducedMotion);
				return reducedMotion
					? `Reduced motion is on; paused at the first pairing. ${describeStep(0)}`
					: "Restarted the join from the first pairing.";
			},
			describe: () => {
				const unmatched = join.pairs.filter(
					(pair) => pair.right === null,
				).length;
				const fanout = Math.max(
					1,
					...join.leftRows.map(
						(row) =>
							join.pairs.filter((pair) => pair.left === row.rowid).length,
					),
				);
				const where =
					cursor >= total
						? `Finished: ${total} output rows from ${join.leftRows.length} ${join.leftTable} rows.`
						: `Currently on ${describeStep(cursor)}`;
				return `Join walkthrough: ${join.leftTable} ${join.kind === "left" ? "LEFT JOIN" : "JOIN"} ${join.rightTable}${join.on ? ` ON ${join.on}` : ""}. ${total} output rows total, largest fan-out ${fanout}, ${unmatched} left row(s) matched nothing. ${playing ? "Playing" : "Paused"}. ${where}`;
			},
		};
		onRegister(controller);
		return () => onRegister(null);
	}, [cursor, describeStep, join, onRegister, playing, reducedMotion, total]);

	return {
		cursor,
		setCursor,
		playing,
		setPlaying,
		speedIndex,
		setSpeedIndex,
		reducedMotion,
		total,
		done,
		activePair,
		emitted,
		matchIndex,
		leftById,
		rightById,
		producing,
		unmatchedCount: join.pairs.filter((pair) => pair.right === null).length,
	};
}

export type JoinWalkthroughModel = ReturnType<typeof useJoinWalkthrough>;

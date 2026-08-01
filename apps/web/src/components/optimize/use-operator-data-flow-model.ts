import { useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
	chooseRowColumns,
	classifyPlanOperator,
} from "@/lib/optimize/operator-visual";

import type { OperatorDataFlowProps } from "./operator-data-flow-types";

const MAX_SOURCE_ROWS = 12;

export function useOperatorDataFlowModel(props: OperatorDataFlowProps) {
	const reducedMotion = useReducedMotion();
	const node =
		props.plan?.flat.find((entry) => entry.id === props.focusedId) ??
		props.plan?.flat[0] ??
		null;
	const kind = classifyPlanOperator(node, props.walk?.join != null);
	const matched = useMemo(
		() => new Set(props.walk?.matchedRowids ?? []),
		[props.walk?.matchedRowids],
	);
	const columns = chooseRowColumns(
		props.walk?.columns.length
			? props.walk.columns
			: [
					...(props.walk?.join?.leftColumns ?? []),
					...(props.walk?.join?.rightColumns ?? []),
				],
		props.walk?.projected ?? [],
		props.walk?.where ?? null,
		props.sample?.columns ?? [],
	);
	const joinedRows = props.walk?.join
		? node?.table === props.walk.join.rightTable
			? props.walk.join.rightRows
			: props.walk.join.leftRows
		: [];
	const availableRows = props.walk?.rows.length ? props.walk.rows : joinedRows;
	const sourceRows =
		kind === "seek"
			? (availableRows.filter((row) => matched.has(row.rowid)).length > 0
					? availableRows.filter((row) => matched.has(row.rowid))
					: availableRows
				).slice(0, MAX_SOURCE_ROWS)
			: availableRows.slice(0, MAX_SOURCE_ROWS);
	const itemCount = Math.max(
		1,
		kind === "sort"
			? (props.sample?.rows.length ?? 0)
			: props.walk?.join
				? props.walk.join.pairs.length
				: sourceRows.length || (props.sample?.rows.length ?? 0),
	);
	const [revealed, setRevealed] = useState(itemCount);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		void props.replayKey;
		setRevealed(reducedMotion || props.playback === "complete" ? itemCount : 0);
	}, [itemCount, props.playback, props.replayKey, reducedMotion]);
	useEffect(() => {
		if (timer.current !== null) clearTimeout(timer.current);
		timer.current = null;
		if (reducedMotion || props.playback === "complete") {
			setRevealed(itemCount);
			return;
		}
		if (props.playback !== "playing" || revealed >= itemCount) return;
		timer.current = setTimeout(
			() => setRevealed((count) => Math.min(count + 1, itemCount)),
			140,
		);
		return () => {
			if (timer.current !== null) clearTimeout(timer.current);
		};
	}, [itemCount, props.playback, reducedMotion, revealed]);

	return {
		node,
		kind,
		matched,
		columns,
		sourceRows,
		revealed,
		work: props.benchmark?.work,
		hasRealRows: Boolean(
			props.walk?.rows.length ||
				props.walk?.join?.pairs.length ||
				props.sample?.rows.length,
		),
	};
}

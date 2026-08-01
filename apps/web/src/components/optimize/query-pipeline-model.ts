import { Copy, Filter, Layers, Rows3, Table2 } from "lucide-react";

import type { StageMeasurement } from "@/lib/sql-engine/query-stages";

export const STAGE_META: Record<
	StageMeasurement["stage"],
	{ icon: typeof Table2; tint: string; bar: string }
> = {
	input: { icon: Table2, tint: "text-sky", bar: "bg-sky" },
	join: { icon: Copy, tint: "text-amber", bar: "bg-amber" },
	where: { icon: Filter, tint: "text-lime", bar: "bg-lime" },
	group: { icon: Layers, tint: "text-periwinkle", bar: "bg-periwinkle" },
	having: { icon: Filter, tint: "text-periwinkle", bar: "bg-periwinkle" },
	distinct: { icon: Layers, tint: "text-periwinkle", bar: "bg-periwinkle" },
	final: { icon: Rows3, tint: "text-cream", bar: "bg-cream" },
};

export function formatPipelineRows(stage: StageMeasurement): string {
	return `${stage.atLeast ? "≥" : ""}${stage.rows.toLocaleString()}`;
}

export function describePipelineDelta(
	stage: StageMeasurement,
	previous: StageMeasurement | null,
): { text: string; tone: "drop" | "fanout" | "same" | "none" } {
	if (
		!previous ||
		stage.stage === "input" ||
		previous.atLeast ||
		stage.atLeast
	) {
		return { text: "", tone: "none" };
	}
	if (stage.rows > previous.rows) {
		const factor = previous.rows === 0 ? 0 : stage.rows / previous.rows;
		return {
			text: `fans out ×${factor >= 10 ? Math.round(factor) : factor.toFixed(1)}`,
			tone: "fanout",
		};
	}
	if (stage.rows === previous.rows)
		return { text: "keeps everything", tone: "same" };
	return {
		text: `drops ${(previous.rows - stage.rows).toLocaleString()}`,
		tone: "drop",
	};
}

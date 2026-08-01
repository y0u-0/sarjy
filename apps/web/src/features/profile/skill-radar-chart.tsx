import { defineChart } from "@tanstack/charts";
import {
	angleGrid,
	type PolarGuideLabelContext,
	polar,
	radialArea,
	radialDot,
	radialGrid,
	radialLine,
} from "@tanstack/charts/polar";
import { Chart } from "@tanstack/react-charts";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveLinearClosed } from "d3-shape";
import { useMemo } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

import type { SkillRadarPoint } from "./skill-landscape-model";

function angleLabelAnchor({
	x,
}: PolarGuideLabelContext): "start" | "middle" | "end" {
	if (x < -1) return "end";
	if (x > 1) return "start";
	return "middle";
}

function angleLabelBaseline({
	y,
}: PolarGuideLabelContext): "auto" | "middle" | "hanging" {
	if (y < -1) return "auto";
	if (y > 1) return "hanging";
	return "middle";
}

export function SkillRadarChart({
	rows,
	comparisonRows,
	hasComparison,
	focusedConcept,
	ariaSummary,
	onInspect,
}: {
	rows: SkillRadarPoint[];
	comparisonRows: SkillRadarPoint[];
	hasComparison: boolean;
	focusedConcept: string | null;
	ariaSummary: string;
	onInspect: (concept: string | null) => void;
}) {
	const reducedMotion = useReducedMotion();
	const chartDefinition = useMemo(() => {
		const concepts = rows.map((row) => row.concept);
		const started = rows.filter((row) => row.opportunities > 0);
		const spotlight = rows.filter((row) => row.concept === focusedConcept);
		const marks = [
			...(hasComparison
				? [
						radialLine(comparisonRows, {
							angle: "concept",
							radius: "strength",
							curve: curveLinearClosed,
							stroke: "var(--muted-foreground)",
							strokeOpacity: 0.8,
							strokeWidth: 2,
							strokeDasharray: "5 5",
						}),
					]
				: []),
			radialArea(rows, {
				angle: "concept",
				radius: "strength",
				curve: curveLinearClosed,
				fill: "var(--periwinkle)",
				fillOpacity: 0.18,
			}),
			radialLine(rows, {
				angle: "concept",
				radius: "strength",
				curve: curveLinearClosed,
				stroke: "var(--periwinkle)",
				strokeWidth: 2.5,
			}),
			radialDot(started, {
				angle: "concept",
				radius: "strength",
				key: "concept",
				r: 4,
				fill: "var(--lime)",
				stroke: "var(--card)",
				strokeWidth: 2,
			}),
			...(spotlight.length > 0
				? [
						radialDot(spotlight, {
							angle: "concept",
							radius: "strength",
							key: "concept",
							r: 8,
							fill: "var(--tangerine)",
							stroke: "var(--card)",
							strokeWidth: 3,
						}),
					]
				: []),
		];

		return defineChart({
			marks: [
				polar({
					angle: {
						scale: scalePoint<string>().domain(concepts),
						wrap: true,
					},
					radius: { scale: scaleLinear().domain([0, 100]) },
					radiusRatio: 0.66,
					guides: [
						radialGrid({
							values: [25, 50, 75, 100],
							shape: "polygon",
							labels: false,
							stroke: "var(--border)",
						}),
						angleGrid({
							values: concepts,
							labels: true,
							format: (value) =>
								rows.find((row) => row.concept === value)?.label ??
								String(value),
							labelOffset: 10,
							labelFill: "var(--muted-foreground)",
							labelFontSize: 10,
							labelAnchor: angleLabelAnchor,
							labelBaseline: angleLabelBaseline,
							stroke: "var(--border)",
						}),
					],
					marks,
				}),
			],
			animate: !reducedMotion,
			margin: { top: 34, right: 54, bottom: 34, left: 54 },
		});
	}, [rows, comparisonRows, focusedConcept, hasComparison, reducedMotion]);

	return (
		<div className="mt-2 overflow-visible" data-chart-engine="tanstack-charts">
			<Chart
				definition={chartDefinition}
				height={480}
				initialWidth={680}
				ariaLabel={`SQL skill shape. ${ariaSummary}`}
				ariaDescription="Farther from the center means stronger evidence from independent exercise episodes."
				onFocusChange={(point) => onInspect(point?.datum.concept ?? null)}
			/>
		</div>
	);
}

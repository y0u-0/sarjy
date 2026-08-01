import { useRef, useState } from "react";

import type { LabStage } from "@/components/optimize/stage-rail";
import {
	type OptimizationLabProblem,
	optimizationProblemBank,
} from "@/lib/curriculum/optimization-bank";
import type { OptimizationOutcome } from "@/lib/optimize/success";
import type { LabSurface } from "@/lib/optimize/surface";
import type { TimelineVisualPlayback } from "@/lib/optimize/timeline";
import type {
	CompareResponse,
	PlanDiff,
	TableInfo,
} from "@/lib/sql-engine/types";

import type {
	AppliedIndex,
	Measurement,
	QueryInterpretation,
	VoicePrediction,
} from "./optimization-model";

export function useOptimizationState() {
	const [problem, setProblem] = useState<OptimizationLabProblem>(
		optimizationProblemBank[0] as OptimizationLabProblem,
	);
	const [tables, setTables] = useState<TableInfo[]>([]);
	const [indexes, setIndexes] = useState<AppliedIndex[]>([]);
	const [indexSql, setIndexSql] = useState("");
	const [rewriteSql, setRewriteSql] = useState("");
	const [baseline, setBaseline] = useState<Measurement | null>(null);
	const [candidate, setCandidate] = useState<Measurement | null>(null);
	const [comparison, setComparison] = useState<CompareResponse | null>(null);
	const [diff, setDiff] = useState<PlanDiff | null>(null);
	const [outcome, setOutcome] = useState<OptimizationOutcome | null>(null);
	const [busy, setBusy] = useState(false);
	const [focus, setFocus] = useState<{ id: number; note: string } | null>(null);
	const [stage, setStage] = useState<LabStage | null>("interpret");
	const [stageNote, setStageNote] = useState<string | null>(null);
	const [interpretation, setInterpretation] =
		useState<QueryInterpretation | null>(null);
	const [prediction, setPrediction] = useState<VoicePrediction | null>(null);
	const [alternativesVisible, setAlternativesVisible] = useState(false);
	const [replayKey, setReplayKey] = useState(0);
	const [timelineCursor, setTimelineCursor] = useState(0);
	const [timelinePlaying, setTimelinePlaying] = useState(false);
	const [timelineSpeed, setTimelineSpeed] = useState(1);
	const [visualPlayback, setVisualPlayback] =
		useState<TimelineVisualPlayback>("idle");
	const [surface, setSurface] = useState<LabSurface>("workspace");
	const [surfaceNote, setSurfaceNote] = useState<string | null>(null);
	const [surfaceRevision, setSurfaceRevision] = useState(0);

	const problemRef = useRef(problem);
	problemRef.current = problem;
	const indexesRef = useRef(indexes);
	indexesRef.current = indexes;
	const baselineRef = useRef(baseline);
	baselineRef.current = baseline;
	const candidateRef = useRef(candidate);
	candidateRef.current = candidate;
	const predictionRef = useRef(prediction);
	predictionRef.current = prediction;
	const surfaceRef = useRef(surface);
	surfaceRef.current = surface;
	const attemptStartedAt = useRef(Date.now());
	const requestRevision = useRef(0);

	return {
		problem,
		setProblem,
		problemRef,
		tables,
		setTables,
		indexes,
		setIndexes,
		indexesRef,
		indexSql,
		setIndexSql,
		rewriteSql,
		setRewriteSql,
		baseline,
		setBaseline,
		baselineRef,
		candidate,
		setCandidate,
		candidateRef,
		comparison,
		setComparison,
		diff,
		setDiff,
		outcome,
		setOutcome,
		busy,
		setBusy,
		focus,
		setFocus,
		stage,
		setStage,
		stageNote,
		setStageNote,
		interpretation,
		setInterpretation,
		prediction,
		setPrediction,
		predictionRef,
		alternativesVisible,
		setAlternativesVisible,
		replayKey,
		setReplayKey,
		timelineCursor,
		setTimelineCursor,
		timelinePlaying,
		setTimelinePlaying,
		timelineSpeed,
		setTimelineSpeed,
		visualPlayback,
		setVisualPlayback,
		surface,
		setSurface,
		surfaceRef,
		surfaceNote,
		setSurfaceNote,
		surfaceRevision,
		setSurfaceRevision,
		attemptStartedAt,
		requestRevision,
	};
}

export type OptimizationState = ReturnType<typeof useOptimizationState>;

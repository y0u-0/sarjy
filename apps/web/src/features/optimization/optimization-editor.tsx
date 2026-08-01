import { Button } from "@sarjy-sql/ui/components/button";
import { GitCompare, MessageCircle, Send } from "lucide-react";

import { SqlEditor } from "@/components/sql-editor";
import type { OptimizationLabProblem } from "@/lib/curriculum/optimization-bank";
import type { TableInfo } from "@/lib/sql-engine/types";

import type { VoicePrediction } from "./optimization-model";

interface OptimizationEditorProps {
	problem: OptimizationLabProblem;
	prediction: VoicePrediction | null;
	isAuthoring: boolean;
	indexSql: string;
	onIndexSqlChange: (sql: string) => void;
	rewriteSql: string;
	onRewriteSqlChange: (sql: string) => void;
	tables: TableInfo[];
	busy: boolean;
	activeIndexCount: number;
	onMeasure: () => void;
}

export function OptimizationEditor({
	problem,
	prediction,
	isAuthoring,
	indexSql,
	onIndexSqlChange,
	rewriteSql,
	onRewriteSqlChange,
	tables,
	busy,
	activeIndexCount,
	onMeasure,
}: OptimizationEditorProps) {
	if (!prediction?.response || !isAuthoring) return null;

	const hasSql = problem.mode === "index" ? indexSql.trim() : rewriteSql.trim();

	return (
		<section className="motion-safe:fade-in mt-4 border-border border-t pt-4 motion-safe:animate-in motion-safe:duration-200">
			<div className="mb-3 rounded-2xl border border-lime/35 bg-lime/8 px-3 py-2">
				<p className="font-semibold text-[10px] text-lime uppercase tracking-[0.08em]">
					Prediction locked before measurement
				</p>
				<p className="mt-1 text-foreground/90 text-xs leading-relaxed">
					{prediction.response}
				</p>
			</div>
			<div className="mb-2 flex flex-wrap items-center gap-2">
				<p className="font-semibold text-sm">
					{problem.mode === "index"
						? "Write an index"
						: problem.technique === "ctas"
							? "Write the reusable summary"
							: "Write the rewrite"}
				</p>
				<span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<MessageCircle className="size-3.5" /> Ask Sarjy before guessing
				</span>
			</div>
			{problem.mode === "index" ? (
				<SqlEditor
					value={indexSql}
					onChange={onIndexSqlChange}
					onRun={onMeasure}
					tables={tables}
					suggestion={null}
					onSuggestionResolve={() => {}}
					placeholder="CREATE INDEX …"
					height="120px"
				/>
			) : (
				<SqlEditor
					value={rewriteSql}
					onChange={onRewriteSqlChange}
					onRun={onMeasure}
					tables={tables}
					suggestion={null}
					onSuggestionResolve={() => {}}
					height="180px"
				/>
			)}
			<div className="mt-2 flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					disabled={busy || !hasSql}
					onClick={onMeasure}
					className="min-h-11 rounded-full active:scale-[0.96]"
				>
					{problem.mode === "index" ? (
						<Send className="size-3.5" />
					) : (
						<GitCompare className="size-3.5" />
					)}
					{busy
						? "Measuring…"
						: problem.mode === "index"
							? "Ask Sarjy to measure"
							: problem.technique === "ctas"
								? "Ask Sarjy to build"
								: "Ask Sarjy to compare"}
				</Button>
				{activeIndexCount > 0 && (
					<span className="font-mono text-[10px] text-lime">
						{activeIndexCount} index{activeIndexCount === 1 ? "" : "es"} active
					</span>
				)}
			</div>
		</section>
	);
}

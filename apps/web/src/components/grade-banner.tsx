import { Button } from "@sarjy-sql/ui/components/button";
import { cn } from "@sarjy-sql/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import type { GradeReport } from "@/lib/sql-engine/types";

interface GradeBannerProps {
	grade: GradeReport;
	nextId: string | null;
	nextLabel?: string;
	choosingNext?: boolean;
}

export function GradeBanner({
	grade,
	nextId,
	nextLabel = "Recommended next",
	choosingNext = false,
}: GradeBannerProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm",
				grade.pass
					? "border-lime/60 bg-lime/15"
					: "border-tangerine/60 bg-tangerine/15",
			)}
		>
			{grade.pass ? (
				<CheckCircle2 className="size-4 shrink-0 text-lime" />
			) : (
				<XCircle className="size-4 shrink-0 text-tangerine" />
			)}
			<span className="font-medium text-foreground">{grade.message}</span>
			{grade.pass && choosingNext && (
				<span className="ml-auto text-muted-foreground text-xs">
					Choosing the next useful step…
				</span>
			)}
			{grade.pass && nextId && (
				<span className="ml-auto">
					<Button
						size="xs"
						nativeButton={false}
						render={
							<Link to="/learn/$exerciseId" params={{ exerciseId: nextId }} />
						}
					>
						{nextLabel}
						<ArrowRight data-icon="inline-end" />
					</Button>
				</span>
			)}
		</div>
	);
}

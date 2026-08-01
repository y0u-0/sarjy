import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	CircleDot,
	CloudSun,
	Gauge,
	GraduationCap,
	MessageCircleQuestion,
	UserRound,
} from "lucide-react";

import UserMenu from "@/components/user-menu";
import { getExercise } from "@/lib/curriculum";
import { orpc } from "@/utils/orpc";

interface QuestionNavigationProps {
	onNavigate?: () => void;
}

export function QuestionNavigation({ onNavigate }: QuestionNavigationProps) {
	const queue = useQuery(orpc.practice.queue.queryOptions());
	const startingPoint = useQuery(orpc.practice.startingPoint.queryOptions());
	const needsInterview = startingPoint.data?.kind === "interview";
	const questions = (queue.data ?? []).flatMap((item) => {
		const entry = getExercise(item.exerciseId);
		return entry ? [{ item, entry }] : [];
	});

	return (
		<div className="flex h-full min-h-0 flex-col border-border border-r bg-ink">
			<div className="shrink-0 px-3 py-3">
				<Link
					to="/"
					onClick={onNavigate}
					className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-soft px-3 py-1.5 font-semibold text-foreground text-sm transition-colors duration-300 hover:bg-foreground/10"
				>
					<GraduationCap className="size-4 text-lime" />
					Sarjy
				</Link>
			</div>
			<nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
				<div className="mb-4">
					<p className="px-3 font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
						{needsInterview ? "Starting point" : "Your three questions"}
					</p>
					<p className="mt-1 px-3 text-[11px] text-muted-foreground leading-relaxed">
						{needsInterview
							? "A short interview will tune your first set."
							: "Sarjy changes one only after you pass or skip it."}
					</p>
					<ul className="mt-2 flex flex-col gap-1">
						{needsInterview && (
							<li>
								<Link
									to="/learn"
									onClick={onNavigate}
									activeOptions={{ exact: true }}
									className="flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors duration-300"
									activeProps={{
										className: "bg-cream font-semibold text-ink",
									}}
									inactiveProps={{ className: "hover:bg-foreground/10" }}
								>
									<MessageCircleQuestion className="size-3.5 shrink-0 text-periwinkle" />
									Meet Sarjy
								</Link>
							</li>
						)}
						{!needsInterview &&
							queue.isPending &&
							[0, 1, 2].map((slot) => (
								<li
									key={slot}
									className="h-10 animate-pulse rounded-full bg-foreground/5"
								/>
							))}
						{questions.map(({ item, entry }) => (
							<li key={item.exerciseId}>
								<Link
									to="/learn/$exerciseId"
									params={{ exerciseId: item.exerciseId }}
									onClick={onNavigate}
									className="group/item flex min-h-10 items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors duration-300"
									activeProps={{
										className: "bg-cream font-semibold text-ink",
									}}
									inactiveProps={{
										className: "hover:bg-foreground/10",
									}}
								>
									<CircleDot className="size-3.5 shrink-0 text-lime group-data-[status=active]/item:text-ink" />
									<span className="line-clamp-2">{entry.exercise.title}</span>
								</Link>
							</li>
						))}
					</ul>
					{queue.isError && (
						<p className="mt-2 px-3 text-tangerine text-xs">
							Couldn’t choose questions. Try reloading.
						</p>
					)}
				</div>
				<div className="mb-4">
					<p className="mb-1.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-[0.08em]">
						Going deeper
					</p>
					<Link
						to="/learn/optimize"
						onClick={onNavigate}
						className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors duration-300"
						activeProps={{ className: "bg-cream font-semibold text-ink" }}
						inactiveProps={{ className: "hover:bg-foreground/10" }}
					>
						<Gauge className="size-3.5 shrink-0 text-periwinkle group-data-[status=active]/item:text-ink" />
						Optimization lab
					</Link>
					<Link
						to="/learn/live-data"
						onClick={onNavigate}
						className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors duration-300"
						activeProps={{ className: "bg-cream font-semibold text-ink" }}
						inactiveProps={{ className: "hover:bg-foreground/10" }}
					>
						<CloudSun className="size-3.5 shrink-0 text-periwinkle group-data-[status=active]/item:text-ink" />
						Live data mission
					</Link>
					<Link
						to="/learn/profile"
						onClick={onNavigate}
						className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors duration-300"
						activeProps={{ className: "bg-cream font-semibold text-ink" }}
						inactiveProps={{ className: "hover:bg-foreground/10" }}
					>
						<UserRound className="size-3.5 shrink-0 text-periwinkle group-data-[status=active]/item:text-ink" />
						Where you stand
					</Link>
				</div>
			</nav>
			<div className="shrink-0 border-border border-t p-2">
				<UserMenu />
			</div>
		</div>
	);
}

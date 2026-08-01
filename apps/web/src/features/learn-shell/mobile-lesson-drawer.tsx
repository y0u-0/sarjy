import { Link } from "@tanstack/react-router";
import { GraduationCap, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { QuestionNavigation } from "./question-navigation";

export function MobileLessonNavigation() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;

		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [open]);

	return (
		<>
			<header className="flex h-14 shrink-0 items-center justify-between border-border border-b bg-ink px-3 md:hidden">
				<Link
					to="/learn"
					className="inline-flex items-center gap-2 rounded-full border border-border bg-ink-soft px-3 py-1.5 font-semibold text-foreground text-sm"
				>
					<GraduationCap className="size-4 text-lime" />
					Sarjy
				</Link>
				<button
					type="button"
					className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-ink-soft text-foreground transition-colors duration-200 hover:bg-foreground/10"
					aria-label="Open lesson navigation"
					aria-controls="mobile-lesson-navigation"
					aria-expanded={open}
					onClick={() => setOpen(true)}
				>
					<Menu className="size-5" />
				</button>
			</header>
			{open && (
				<div className="fixed inset-0 z-[70] md:hidden">
					<button
						type="button"
						className="absolute inset-0 bg-black/65 backdrop-blur-sm"
						aria-label="Close lesson navigation"
						onClick={() => setOpen(false)}
					/>
					<aside
						id="mobile-lesson-navigation"
						role="dialog"
						aria-modal="true"
						aria-label="Lesson navigation"
						className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] border-border border-r bg-ink shadow-2xl"
					>
						<button
							type="button"
							className="absolute top-2 right-2 z-10 inline-flex size-11 items-center justify-center rounded-full border border-border bg-ink-soft text-foreground"
							aria-label="Close lesson navigation"
							onClick={() => setOpen(false)}
						>
							<X className="size-5" />
						</button>
						<QuestionNavigation onNavigate={() => setOpen(false)} />
					</aside>
				</div>
			)}
		</>
	);
}

import { Outlet } from "@tanstack/react-router";

import { TeacherDock } from "@/components/teacher/teacher-dock";
import { TeacherProvider } from "@/components/teacher/teacher-provider";

import { MobileLessonNavigation } from "./mobile-lesson-drawer";
import { QuestionNavigation } from "./question-navigation";

export function LearnLayout() {
	return (
		<TeacherProvider>
			<div className="flex h-full min-h-0 flex-col md:grid md:grid-cols-[230px_minmax(0,1fr)]">
				<aside className="hidden min-h-0 md:block">
					<QuestionNavigation />
				</aside>
				<MobileLessonNavigation />
				<main className="min-h-0 flex-1 overflow-hidden">
					<Outlet />
				</main>
			</div>
			<TeacherDock />
		</TeacherProvider>
	);
}

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useTeacher } from "@/components/teacher/teacher-provider";

import type { ProfileEvidenceRow } from "./profile-model";
import { createProfileTeacherController } from "./profile-teacher-controller";
import type {
	SkillHistorySnapshotView,
	SkillLandscapeView,
} from "./skill-landscape-model";

interface ProfileTeacherBridgeOptions {
	profile: ProfileEvidenceRow[] | undefined;
	history: SkillHistorySnapshotView[] | undefined;
	view: SkillLandscapeView;
	comparisonId: string | null;
	focusedConcept: string | null;
	setView: (view: SkillLandscapeView) => void;
	setComparisonId: (id: string | null) => void;
	setFocus: (concept: string | null, note: string | null) => void;
	markViewControlled: () => void;
}

export function useProfileTeacherController(
	options: ProfileTeacherBridgeOptions,
) {
	const teacher = useTeacher();
	const latest = useRef(options);
	latest.current = options;
	const revealLandscape = useCallback(() => {
		window.requestAnimationFrame(() => {
			document.getElementById("skill-landscape")?.scrollIntoView({
				behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
					? "auto"
					: "smooth",
				block: "start",
			});
		});
	}, []);
	const controller = useMemo(
		() =>
			createProfileTeacherController({
				getProfile: () => latest.current.profile,
				getHistory: () => latest.current.history,
				getView: () => latest.current.view,
				getComparisonId: () => latest.current.comparisonId,
				getFocusedConcept: () => latest.current.focusedConcept,
				setView: (view) => latest.current.setView(view),
				setComparisonId: (id) => latest.current.setComparisonId(id),
				setFocus: (concept, note) => latest.current.setFocus(concept, note),
				markViewControlled: () => latest.current.markViewControlled(),
				revealLandscape,
			}),
		[revealLandscape],
	);

	useEffect(() => {
		teacher.registerProfile(controller);
		return () => teacher.registerProfile(null);
	}, [teacher.registerProfile, controller]);
}

export function useProfileScreenContext({
	summary,
	onEvidenceRevision,
}: {
	summary: string;
	onEvidenceRevision: () => void;
}) {
	const teacher = useTeacher();
	const refresh = useRef(onEvidenceRevision);
	refresh.current = onEvidenceRevision;
	useEffect(() => {
		teacher.setScreenContext({
			kind: "profile",
			title: "Your learner profile",
			summary,
		});
		return () => teacher.setScreenContext(null);
	}, [teacher.setScreenContext, summary]);
	useEffect(() => {
		if (teacher.evidenceRevision > 0) refresh.current();
	}, [teacher.evidenceRevision]);
}

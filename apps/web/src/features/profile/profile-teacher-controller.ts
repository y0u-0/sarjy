import type { ProfileController } from "@/lib/profile/profile-controller";

import {
	describeProfileSnapshot,
	PROFILE_TITLES,
	type ProfileEvidenceRow,
	resolveProfileConcept,
} from "./profile-model";
import type { SkillHistorySnapshotView } from "./skill-landscape-model";

interface ProfileControllerPorts {
	getProfile: () => ProfileEvidenceRow[] | undefined;
	getHistory: () => SkillHistorySnapshotView[] | undefined;
	getView: () => "learn" | "optimization";
	getComparisonId: () => string | null;
	getFocusedConcept: () => string | null;
	setView: (view: "learn" | "optimization") => void;
	setComparisonId: (id: string | null) => void;
	setFocus: (concept: string | null, note: string | null) => void;
	markViewControlled: () => void;
	revealLandscape: () => void;
}

export function createProfileTeacherController(
	ports: ProfileControllerPorts,
): ProfileController {
	return {
		describe: () => {
			const profile = ports.getProfile();
			if (!profile) return "The learner evidence is still loading.";
			const view = ports.getView();
			const activeRows = profile.filter((row) =>
				view === "optimization"
					? row.concept.startsWith("optimization-")
					: !row.concept.startsWith("optimization-"),
			);
			const evidence = activeRows
				.filter((row) => row.opportunities > 0)
				.map(
					(row) => `${row.concept}: ${row.passes}/${row.opportunities} right`,
				)
				.join("; ");
			const history = ports.getHistory();
			const sessions =
				history
					?.map(
						(snapshot) =>
							`session ${snapshot.sessionNumber} id ${snapshot.id} ending ${new Date(snapshot.endedAt).toLocaleString()}`,
					)
					.join("; ") || "none yet";
			return [
				`Profile radar is showing ${view}.`,
				`Comparison: ${describeProfileSnapshot(history, ports.getComparisonId())}.`,
				`Spotlight: ${ports.getFocusedConcept() ?? "none"}.`,
				`Visible evidence: ${evidence || "no graded work in this view"}.`,
				`Available earlier sessions: ${sessions}.`,
				`Exact topic ids: ${activeRows.map((row) => row.concept).join(", ")}.`,
			].join(" ");
		},
		setView: (requested) => {
			if (requested !== "learn" && requested !== "optimization") {
				return "Unknown profile view. Use learn or optimization.";
			}
			ports.markViewControlled();
			ports.setView(requested);
			ports.setFocus(null, null);
			ports.revealLandscape();
			return `The profile radar now shows ${requested} topics.`;
		},
		compareSession: (requested) => {
			if (requested === "current" || requested === "none") {
				ports.setComparisonId(null);
				ports.revealLandscape();
				return "The radar now shows only the current learner model.";
			}
			const history = ports.getHistory();
			const latest = history?.at(-1);
			const snapshot =
				requested === "previous"
					? latest
					: history?.find(
							(entry) =>
								entry.id === requested ||
								String(entry.sessionNumber) === requested ||
								`session-${entry.sessionNumber}` === requested,
						);
			if (!snapshot) {
				return history?.length
					? "That comparison session does not exist. Call profile_describe for the available ids."
					: "There is no earlier completed session to compare yet.";
			}
			ports.setComparisonId(snapshot.id);
			ports.revealLandscape();
			return `The dashed shape is now session ${snapshot.sessionNumber}; the filled shape is now.`;
		},
		focusTopic: (requested, note) => {
			const concept = resolveProfileConcept(requested);
			if (!concept) {
				return "That topic is not in this profile. Call profile_describe for exact topic ids.";
			}
			ports.markViewControlled();
			ports.setView(
				concept.startsWith("optimization-") ? "optimization" : "learn",
			);
			ports.setFocus(concept, note.trim() || null);
			ports.revealLandscape();
			const row = ports
				.getProfile()
				?.find((entry) => entry.concept === concept);
			return `Spotlighted ${PROFILE_TITLES.get(concept) ?? concept}. Current evidence is ${row?.passes ?? 0}/${row?.opportunities ?? 0} right.`;
		},
	};
}

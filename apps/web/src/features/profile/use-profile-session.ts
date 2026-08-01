import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { SkillLandscapeView } from "@/components/practice/skill-landscape";
import { orpc } from "@/utils/orpc";

import {
	buildProfileEvidenceModel,
	initialSkillLandscapeView,
	PROFILE_CONCEPTS,
	profileScreenSummary,
	titleForProfileConcept,
} from "./profile-model";
import {
	useProfileScreenContext,
	useProfileTeacherController,
} from "./use-profile-teacher-bridge";

export function useProfileSession() {
	const queryClient = useQueryClient();
	const [radarView, setRadarView] = useState<SkillLandscapeView>("learn");
	const [comparisonId, setComparisonId] = useState<string | null>(null);
	const [focusedConcept, setFocusedConcept] = useState<string | null>(null);
	const [focusNote, setFocusNote] = useState<string | null>(null);
	const comparisonInitialized = useRef(false);
	const radarViewInitialized = useRef(false);

	const profile = useQuery(
		orpc.practice.profile.queryOptions({
			input: { concepts: PROFILE_CONCEPTS },
		}),
	);
	const history = useQuery(
		orpc.practice.history.queryOptions({
			input: { concepts: PROFILE_CONCEPTS },
		}),
	);
	const memoriesOptions = orpc.learner.memories.queryOptions();
	const memories = useQuery(memoriesOptions);
	const forgetMemory = useMutation(
		orpc.learner.forgetMemory.mutationOptions({
			onSuccess: async ({ deleted }) => {
				if (!deleted) {
					toast.error("That memory was already gone.");
					return;
				}
				await queryClient.invalidateQueries(memoriesOptions);
				toast.success("Sarjy forgot that memory.");
			},
			onError: () => toast.error("Couldn’t forget that memory right now."),
		}),
	);

	const evidence = useMemo(
		() => buildProfileEvidenceModel(profile.data ?? []),
		[profile.data],
	);
	const selectedComparison = history.data?.find(
		(snapshot) => snapshot.id === comparisonId,
	);

	useEffect(() => {
		if (!profile.data || radarViewInitialized.current) return;
		setRadarView(initialSkillLandscapeView(profile.data));
		radarViewInitialized.current = true;
	}, [profile.data]);

	useEffect(() => {
		if (!history.data || history.data.length === 0) return;
		const latest = history.data.at(-1);
		if (!latest) return;
		if (!comparisonInitialized.current) {
			comparisonInitialized.current = true;
			setComparisonId(latest.id);
			return;
		}
		if (
			comparisonId !== null &&
			!history.data.some((snapshot) => snapshot.id === comparisonId)
		) {
			setComparisonId(latest.id);
		}
	}, [history.data, comparisonId]);

	useProfileTeacherController({
		profile: profile.data,
		history: history.data,
		view: radarView,
		comparisonId,
		focusedConcept,
		setView: setRadarView,
		setComparisonId,
		setFocus: (concept, note) => {
			setFocusedConcept(concept);
			setFocusNote(note);
		},
		markViewControlled: () => {
			radarViewInitialized.current = true;
		},
	});

	const screenSummary = useMemo(() => {
		if (!profile.data || !memories.data) {
			return "The learner profile is loading its submission evidence and saved-memory ledger.";
		}
		return profileScreenSummary({
			evidence,
			memories: memories.data.facts,
			radarView,
			comparison: selectedComparison,
			focusedConcept,
		});
	}, [
		evidence,
		focusedConcept,
		memories.data,
		profile.data,
		radarView,
		selectedComparison,
	]);

	useProfileScreenContext({
		summary: screenSummary,
		onEvidenceRevision: () => {
			void profile.refetch();
			void history.refetch();
			void memories.refetch();
		},
	});

	const changeRadarView = useCallback((nextView: SkillLandscapeView) => {
		radarViewInitialized.current = true;
		setRadarView(nextView);
		setFocusedConcept(null);
		setFocusNote(null);
	}, []);

	return {
		evidence,
		profilePending: profile.isPending,
		profileError: profile.isError,
		profileSuccess: profile.isSuccess,
		history: history.data ?? [],
		historyPending: history.isPending,
		historyError: history.isError,
		memories: memories.data?.facts ?? [],
		memoriesPending: memories.isPending,
		memoriesError: memories.isError,
		forgettingMemory: forgetMemory.isPending,
		forgetMemory: (id: number) => forgetMemory.mutate({ id }),
		radarView,
		changeRadarView,
		comparisonId,
		setComparisonId,
		focusedConcept,
		focusNote,
		titleForConcept: titleForProfileConcept,
	};
}

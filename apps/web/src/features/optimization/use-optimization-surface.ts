import { useCallback, useEffect } from "react";

import type { LabSurface } from "@/lib/optimize/surface";

import type { OptimizationState } from "./use-optimization-state";

export function useOptimizationSurface(
	state: OptimizationState,
	reducedMotion: boolean,
) {
	const {
		setSurface,
		setSurfaceNote,
		setSurfaceRevision,
		surface,
		surfaceRef,
		surfaceRevision,
	} = state;
	const reveal = useCallback(
		(next: LabSurface, note: string | null = null) => {
			surfaceRef.current = next;
			setSurface(next);
			setSurfaceNote(note);
			setSurfaceRevision((revision) => revision + 1);
		},
		[setSurface, setSurfaceNote, setSurfaceRevision, surfaceRef],
	);

	useEffect(() => {
		if (surfaceRevision === 0) return;
		const frame = requestAnimationFrame(() => {
			const target = document.querySelector<HTMLElement>(
				`[data-lab-surface="${surface}"]`,
			);
			target?.scrollIntoView({
				behavior: reducedMotion ? "auto" : "smooth",
				block: surface === "workspace" ? "center" : "start",
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [reducedMotion, surface, surfaceRevision]);

	return reveal;
}

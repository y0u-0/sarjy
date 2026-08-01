export type SarjyState = null | "thinking" | "listening" | "talking";

export const SARJY_MOUTH_JITTER = [0.85, 1.3, 0.7] as const;
export const SARJY_MOUTH_REST_PX = 3;

interface SarjyVolumeAnimationConditions {
	documentVisible: boolean;
	intersecting: boolean;
	reducedMotion: boolean;
}

export function shouldRunSarjyVolumeAnimation(
	state: SarjyState,
	conditions: SarjyVolumeAnimationConditions,
): boolean {
	return (
		(state === "listening" || state === "talking") &&
		conditions.documentVisible &&
		conditions.intersecting &&
		!conditions.reducedMotion
	);
}

import { Slide } from "./deck-primitives";
import { AdaptiveLoopDemo } from "./slides/adaptive-loop-slide";
import { ClosingSlide } from "./slides/closing-slide";
import { FixedPaceDemo } from "./slides/fixed-pace-slide";
import { OptimizationDemo } from "./slides/optimization-slide";
import { ProfileDemo } from "./slides/profile-slide";
import { SystemFlip } from "./slides/system-flip";
import { TeacherCanvasDemo } from "./slides/teacher-canvas-slide";
import { VerificationDemo } from "./slides/verification-slide";

export const slides = [
	<Slide key="thesis" index={1} label="The reversal">
		<SystemFlip />
	</Slide>,
	<Slide key="problem" index={2} label="The problem" tone="ink">
		<FixedPaceDemo />
	</Slide>,
	<Slide key="loop" index={3} label="The solution" tone="ink">
		<AdaptiveLoopDemo />
	</Slide>,
	<Slide key="verification" index={4} label="Verified understanding">
		<VerificationDemo />
	</Slide>,
	<Slide key="teacher" index={5} label="Agent-led experience" tone="ink">
		<TeacherCanvasDemo />
	</Slide>,
	<Slide key="optimization" index={6} label="Optimization lab">
		<OptimizationDemo />
	</Slide>,
	<Slide key="profile" index={7} label="Learner profile" tone="ink">
		<ProfileDemo />
	</Slide>,
	<Slide key="close" index={8} label="The proposition" tone="lime">
		<ClosingSlide />
	</Slide>,
];

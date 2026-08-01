import { AdaptationSection } from "./sections/adaptation-section";
import { EvidenceSection } from "./sections/evidence-section";
import { LandingHero, LandingNavigation } from "./sections/landing-hero";
import { LandingFooter, LandingOutro } from "./sections/landing-outro";
import {
	LiveDataSection,
	OptimizationSection,
} from "./sections/product-sections";
import { useLandingMotion } from "./use-landing-motion";

export function LandingPage() {
	const { heroTiltRef, rootRef } = useLandingMotion();

	return (
		<div
			ref={rootRef}
			className="landing-shell h-full overflow-y-auto overflow-x-hidden bg-cream text-ink"
		>
			<div className="landing-scroll-progress sticky top-0 z-50 h-0.5 origin-left bg-lime" />
			<a
				href="#main-content"
				className="fixed top-3 left-3 z-50 -translate-y-20 rounded-full border border-ink bg-lime px-4 py-2 font-semibold text-sm transition-transform focus:translate-y-0"
			>
				Skip to content
			</a>

			<LandingNavigation />
			<main id="main-content">
				<LandingHero heroTiltRef={heroTiltRef} />
				<AdaptationSection />
				<EvidenceSection />
				<LiveDataSection />
				<OptimizationSection />
				<LandingOutro />
			</main>
			<LandingFooter />
		</div>
	);
}

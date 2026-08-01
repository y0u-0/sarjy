import { MemoryLedger } from "./memory-ledger";
import {
	EmptyProfileEvidence,
	ProfileEvidenceDashboard,
} from "./profile-evidence-dashboard";
import { ProfileIntroduction } from "./profile-introduction";
import { useProfileSession } from "./use-profile-session";

/**
 * The student's model of themselves, shown to them. The same evidence drives the
 * adaptive policy and every card ends in something the learner can do next.
 */
export function ProfilePage() {
	const session = useProfileSession();

	return (
		<div className="h-full min-h-0 overflow-y-auto">
			<div className="mx-auto max-w-4xl p-6 pb-16">
				<ProfileIntroduction />
				<MemoryLedger
					facts={session.memories}
					pending={session.memoriesPending}
					error={session.memoriesError}
					forgetting={session.forgettingMemory}
					onForget={session.forgetMemory}
				/>

				{session.profilePending && (
					<p className="mt-8 text-muted-foreground text-sm">
						Reading your work…
					</p>
				)}
				{session.profileError && (
					<p className="mt-8 rounded-2xl border border-tangerine/50 bg-tangerine/10 px-4 py-3 text-sm text-tangerine">
						Couldn't load your profile. Refresh and it'll try again.
					</p>
				)}
				{session.profileSuccess && session.evidence.started.length === 0 && (
					<EmptyProfileEvidence />
				)}
				{session.profileSuccess && session.evidence.started.length > 0 && (
					<ProfileEvidenceDashboard
						evidence={session.evidence}
						history={session.history}
						historyPending={session.historyPending}
						historyError={session.historyError}
						view={session.radarView}
						onViewChange={session.changeRadarView}
						comparisonId={session.comparisonId}
						onComparisonChange={session.setComparisonId}
						focusedConcept={session.focusedConcept}
						focusNote={session.focusNote}
						titleFor={session.titleForConcept}
					/>
				)}
			</div>
		</div>
	);
}

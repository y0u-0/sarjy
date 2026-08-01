import { Button } from "@sarjy-sql/ui/components/button";
import { Send } from "lucide-react";

export function WeatherSubmitBar({
	unlocked,
	accepted,
	checking,
	onSubmit,
}: {
	unlocked: boolean;
	accepted: boolean;
	checking: boolean;
	onSubmit: () => void;
}) {
	const disabled = !unlocked || checking;
	const label = checking
		? "Checking…"
		: accepted
			? "Test again"
			: "Submit answer";
	const helper = !unlocked
		? "Make your prediction to unlock submission"
		: accepted
			? "Accepted once · later tests won’t change your profile"
			: "Cmd/Ctrl + Enter also submits";

	return (
		<div className="flex flex-wrap items-center gap-2 border-border border-t bg-ink-soft/50 px-4 py-3">
			<Button onClick={onSubmit} disabled={disabled}>
				<Send data-icon="inline-start" />
				{label}
			</Button>
			<p className="font-mono text-[11px] text-muted-foreground">{helper}</p>
		</div>
	);
}

import { WeatherMissionCanvas } from "@/components/live-data/weather-mission-canvas";

import { useLiveDataSession } from "./use-live-data-session";

export function LiveDataPage() {
	const session = useLiveDataSession();

	return (
		<WeatherMissionCanvas
			mission={session.mission}
			lesson={session.lesson}
			surface={session.surface}
			surfaceNote={session.surfaceNote}
			querySql={session.querySql}
			tables={session.tables}
			submission={session.submission}
			plan={session.plan}
			busy={session.busy}
			suggestion={session.suggestion}
			onQueryChange={session.setQuerySql}
			onCheckQuery={() => void session.checkQuery()}
			onSuggestionResolve={session.dismissSuggestion}
		/>
	);
}

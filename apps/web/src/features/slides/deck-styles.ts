export const deckStyles = `
	:root {
		--case-ease-out: cubic-bezier(.165,.84,.44,1);
		--case-ease-move: cubic-bezier(.77,0,.175,1);
	}

	.case-slide-enter {
		animation: case-slide-enter 360ms var(--case-ease-out) both;
	}

	.case-nav-button,
	.case-icon-button {
		display: grid;
		place-items: center;
		width: 2.45cqi;
		height: 2.45cqi;
		border-radius: 999px;
		border: 1px solid rgba(253,249,240,.22);
		background: rgba(20,20,20,.82);
		color: #fdf9f0;
		transition: transform 140ms ease, background-color 140ms ease, opacity 140ms ease;
	}

	.case-nav-button svg,
	.case-icon-button svg { width: .95cqi; height: .95cqi; }
	.case-icon-button svg { width: .95cqi; height: .95cqi; }
	.case-nav-button:disabled { opacity: .2; }
	.case-nav-button:active:not(:disabled),
	.case-icon-button:active { transform: scale(.96); }

	.case-action-button {
		display: inline-flex;
		align-items: center;
		gap: .6cqi;
		min-height: 2.7cqi;
		border: 1px solid rgba(253,249,240,.2);
		border-radius: 999px;
		padding: 0 1.1cqi;
		font: 600 .72cqi/1 "JetBrains Mono", monospace;
		text-transform: uppercase;
		letter-spacing: .1em;
		color: rgba(253,249,240,.72);
		transition: transform 140ms ease, background-color 140ms ease;
	}
	.case-action-button svg { width: .9cqi; height: .9cqi; }
	.case-action-button:active { transform: scale(.97); }

	.case-choice {
		border: 1px solid currentColor;
		border-radius: 999px;
		padding: .58cqi .92cqi;
		font: 650 .65cqi/1 "JetBrains Mono", monospace;
		text-transform: uppercase;
		letter-spacing: .09em;
		opacity: .35;
		transition: opacity 180ms ease, background-color 180ms ease, color 180ms ease;
	}
	.case-choice.is-active { opacity: 1; background: #141414; color: #fdf9f0; }

	.case-sequence-tab {
		display: inline-flex;
		align-items: center;
		gap: .5cqi;
		border: 1px solid rgba(253,249,240,.16);
		border-radius: 999px;
		padding: .62cqi .9cqi;
		font: 650 .64cqi/1 "JetBrains Mono", monospace;
		text-transform: uppercase;
		letter-spacing: .09em;
		color: rgba(253,249,240,.38);
		transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease;
	}
	.case-sequence-tab span { font-size: .52cqi; opacity: .55; }
	.case-sequence-tab.is-active { border-color: #c7ff69; background: #c7ff69; color: #141414; }
	.bg-cream .case-sequence-tab { border-color: rgba(20,20,20,.2); color: rgba(20,20,20,.48); }
	.bg-cream .case-sequence-tab.is-active { border-color: #141414; background: #c7ff69; color: #141414; }

	.case-evidence-row {
		display: grid;
		grid-template-columns: 2.2cqi 1fr;
		align-items: center;
		min-height: 3.7cqi;
		border: 1px solid rgba(253,249,240,.12);
		border-radius: .75cqi;
		padding: .65cqi .8cqi;
		text-align: left;
		opacity: .42;
		transition: transform 220ms var(--case-ease-out), opacity 220ms ease, border-color 220ms ease;
	}
	.case-evidence-row strong { display:block; font-size: .82cqi; }
	.case-evidence-row small { display:block; margin-top:.12cqi; font-size:.62cqi; }
	.case-evidence-row.is-active { transform: translateX(.55cqi); opacity: 1; border-color: rgba(199,255,105,.55); }

	.case-agent-action,
	.case-opt-step {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 3.2cqi;
		border-bottom: 1px solid rgba(20,20,20,.16);
		font-size: .82cqi;
		font-weight: 700;
		text-align: left;
		opacity: .42;
		transition: transform 180ms var(--case-ease-out), opacity 180ms ease, color 180ms ease;
	}
	.case-opt-step svg { width: .9cqi; height: .9cqi; }
	.case-opt-step.is-active { transform: translateX(.45cqi); opacity: 1; color: #ff6d38; }

	.case-agent-action {
		justify-content: flex-start;
		gap: .8cqi;
		min-height: 2.7cqi;
		border-color: rgba(253,249,240,.12);
		color: rgba(253,249,240,.7);
	}
	.case-agent-action span { font: .58cqi/1 "JetBrains Mono", monospace; opacity:.45; }
	.case-agent-action.is-active { transform: translateX(.35cqi); opacity:1; color:#c7ff69; }

	.case-opt-step {
		min-height: 4.1cqi;
		padding: 0 1cqi;
		border: 1px solid rgba(20,20,20,.15);
		border-radius: .8cqi;
	}
	.case-opt-step span { opacity:.45; }
	.case-opt-step.is-active { transform: translateX(-.45cqi); border-color:#141414; background:#141414; color:#c7ff69; }

	.case-model-ring { animation: case-ring 2.6s ease-in-out infinite; }
	.case-value-enter { animation: case-value-enter 260ms var(--case-ease-out) both; }
	.case-next-move { animation: case-value-enter 300ms var(--case-ease-out) both; }
	.case-plan-enter { animation: case-plan-enter 260ms var(--case-ease-out) both; }
	.case-plan-swap { animation: case-value-enter 260ms var(--case-ease-out) both; }
	.case-radar-enter { transform-box: fill-box; transform-origin:center; animation: case-radar-enter 420ms var(--case-ease-out) both; }
	.case-active-line { animation: case-line-grow 1.8s linear both; }
	.case-code-highlight { display:inline-block; border-radius:.35cqi; background:rgba(255,109,56,.14); box-shadow:0 0 0 .4cqi rgba(255,109,56,.14); }
	.case-fast-line { animation: case-line-grow 380ms var(--case-ease-out) both; }
	.case-slow-line { animation: case-line-grow 1.4s var(--case-ease-move) both; }
	.case-learner-run { animation: case-learner-run 1.1s var(--case-ease-move) both; will-change:transform; }
	.case-outcome-enter { opacity:0; animation: case-outcome-enter 240ms var(--case-ease-out) forwards; }

	@keyframes case-slide-enter {
		from { opacity:0; transform:translate3d(0,.7cqi,0); }
		to { opacity:1; transform:translate3d(0,0,0); }
	}
	@keyframes case-value-enter {
		from { opacity:0; transform:translate3d(0,.45cqi,0); }
		to { opacity:1; transform:translate3d(0,0,0); }
	}
	@keyframes case-plan-enter {
		from { opacity:0; transform:translate3d(-.6cqi,0,0) scale(.98); }
		to { opacity:1; transform:translate3d(0,0,0) scale(1); }
	}
	@keyframes case-radar-enter {
		from { opacity:0; transform:scale(.72); }
		to { opacity:1; transform:scale(1); }
	}
	@keyframes case-ring {
		0%,100% { transform:scale(.98); opacity:.45; }
		50% { transform:scale(1.025); opacity:1; }
	}
	@keyframes case-line-grow { from { transform:scaleX(0); } to { transform:scaleX(1); } }
	@keyframes case-learner-run {
		from { transform:translate3d(0,-50%,0); }
		to { transform:translate3d(var(--case-distance),-50%,0); }
	}
	@keyframes case-outcome-enter {
		from { opacity:0; transform:translate3d(-.4cqi,0,0); }
		to { opacity:1; transform:translate3d(0,0,0); }
	}

	@media (hover:hover) and (pointer:fine) {
		.case-nav-button:hover:not(:disabled),
		.case-icon-button:hover,
		.case-action-button:hover { background:#ff6d38; color:#141414; }
	}

	@media (prefers-reduced-motion: reduce) {
		.case-slide-enter,
		.case-model-ring,
		.case-value-enter,
		.case-next-move,
		.case-plan-enter,
		.case-plan-swap,
		.case-radar-enter,
		.case-active-line,
		.case-fast-line,
		.case-slow-line,
		.case-learner-run,
		.case-outcome-enter { animation:none; }
		.case-nav-button,
		.case-icon-button,
		.case-action-button,
		.case-choice,
		.case-sequence-tab,
		.case-evidence-row,
		.case-agent-action,
		.case-opt-step { transition:none; }
	}
`;

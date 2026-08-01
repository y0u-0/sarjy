import {
	type Extension,
	Prec,
	StateEffect,
	StateField,
} from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	keymap,
	WidgetType,
} from "@codemirror/view";

export const setGhostSuggestion = StateEffect.define<string | null>();

const ghostField = StateField.define<string | null>({
	create: () => null,
	update(value, transaction) {
		let next = value;
		for (const effect of transaction.effects) {
			if (effect.is(setGhostSuggestion)) next = effect.value;
		}
		return next;
	},
});

class GhostWidget extends WidgetType {
	constructor(private readonly text: string) {
		super();
	}

	override eq(other: GhostWidget): boolean {
		return other.text === this.text;
	}

	override toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.className = "cm-ghostHint";
		const needsNewline =
			view.state.doc.length > 0 && !view.state.doc.toString().endsWith("\n");
		span.textContent = (needsNewline ? "\n" : "") + this.text;
		return span;
	}

	override get estimatedHeight(): number {
		return -1;
	}
}

const ghostDecorations = EditorView.decorations.compute(
	[ghostField, "doc"],
	(state): DecorationSet => {
		const suggestion = state.field(ghostField);
		if (!suggestion) return Decoration.none;
		const decorations = [];
		if (state.doc.length > 0) {
			decorations.push(
				Decoration.mark({ class: "cm-ghostReplaced" }).range(
					0,
					state.doc.length,
				),
			);
		}
		decorations.push(
			Decoration.widget({
				widget: new GhostWidget(suggestion),
				side: 1,
			}).range(state.doc.length),
		);
		return Decoration.set(decorations, true);
	},
);

const ghostTheme = EditorView.theme({
	".cm-ghostHint": {
		opacity: "0.45",
		fontStyle: "italic",
		whiteSpace: "pre-wrap",
	},
	".cm-ghostReplaced": {
		opacity: "0.35",
		textDecoration: "line-through",
		textDecorationColor: "rgba(255, 109, 56, 0.7)",
	},
});

export function ghostHint(onResolve: (accepted: boolean) => void): Extension {
	const acceptOrDismiss = (view: EditorView, accept: boolean): boolean => {
		const suggestion = view.state.field(ghostField);
		if (!suggestion) return false;
		if (accept) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: suggestion },
				selection: { anchor: suggestion.length },
				effects: setGhostSuggestion.of(null),
			});
		} else {
			view.dispatch({ effects: setGhostSuggestion.of(null) });
		}
		onResolve(accept);
		return true;
	};

	return [
		ghostField,
		ghostDecorations,
		ghostTheme,
		Prec.highest(
			keymap.of([
				{ key: "Tab", run: (view) => acceptOrDismiss(view, true) },
				{ key: "Escape", run: (view) => acceptOrDismiss(view, false) },
			]),
		),
	];
}

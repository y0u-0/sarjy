import { SQLite, sql } from "@codemirror/lang-sql";
import CodeMirror, {
	EditorView,
	keymap,
	Prec,
	type ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef } from "react";

import { ghostHint, setGhostSuggestion } from "@/lib/codemirror/ghost-hint";
import type { TableInfo } from "@/lib/sql-engine/types";

const editorChrome = EditorView.theme({
	"&": {
		fontSize: "13px",
		fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
		backgroundColor: "transparent",
	},
	".cm-content": {
		fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
		padding: "12px 0",
	},
	"&.cm-focused": { outline: "none" },
	".cm-placeholder": { color: "rgba(253,249,240,0.35)" },
});

interface SqlEditorProps {
	value: string;
	onChange: (value: string) => void;
	onRun: () => void;
	tables: TableInfo[];
	suggestion: string | null;
	onSuggestionResolve: (accepted: boolean) => void;
	placeholder?: string;
	height?: string;
	readOnly?: boolean;
}

export function SqlEditor({
	value,
	onChange,
	onRun,
	tables,
	suggestion,
	onSuggestionResolve,
	placeholder = "-- Write your SQL here, then press Run (or Cmd+Enter)",
	height = "200px",
	readOnly = false,
}: SqlEditorProps) {
	const editorRef = useRef<ReactCodeMirrorRef>(null);
	const onRunRef = useRef(onRun);
	onRunRef.current = onRun;
	const onSuggestionResolveRef = useRef(onSuggestionResolve);
	onSuggestionResolveRef.current = onSuggestionResolve;

	const extensions = useMemo(() => {
		const schema = Object.fromEntries(
			tables.map((table) => [
				table.name,
				table.columns.map((column) => column.name),
			]),
		);
		return [
			sql({ dialect: SQLite, schema, upperCaseKeywords: true }),
			editorChrome,
			ghostHint((accepted) => onSuggestionResolveRef.current(accepted)),
			Prec.high(
				keymap.of([
					{
						key: "Mod-Enter",
						run: () => {
							onRunRef.current();
							return true;
						},
					},
				]),
			),
		];
	}, [tables]);

	useEffect(() => {
		const view = editorRef.current?.view;
		if (!view) return;
		view.dispatch({ effects: setGhostSuggestion.of(suggestion) });
	}, [suggestion]);

	return (
		<CodeMirror
			ref={editorRef}
			value={value}
			onChange={onChange}
			editable={!readOnly}
			extensions={extensions}
			theme="dark"
			height={height}
			placeholder={placeholder}
			basicSetup={{
				lineNumbers: true,
				foldGutter: false,
				autocompletion: true,
				highlightActiveLine: true,
			}}
			aria-label="SQL editor"
		/>
	);
}

import { type RefObject, useEffect, useState } from "react";

export interface TextSelection {
	text: string;
	rect: { top: number; left: number; width: number };
}

export function useTextSelection(
	containerRef: RefObject<HTMLElement | null>,
): TextSelection | null {
	const [selection, setSelection] = useState<TextSelection | null>(null);

	useEffect(() => {
		function handleSelectionChange(): void {
			const current = window.getSelection();
			if (!current || current.isCollapsed || current.rangeCount === 0) {
				setSelection(null);
				return;
			}

			const range = current.getRangeAt(0);
			const container = containerRef.current;
			if (!container?.contains(range.commonAncestorContainer)) {
				setSelection(null);
				return;
			}

			const text = current.toString().trim();
			if (!text) {
				setSelection(null);
				return;
			}

			const rect = range.getBoundingClientRect();
			setSelection({
				text,
				rect: { top: rect.top, left: rect.left, width: rect.width },
			});
		}

		document.addEventListener("selectionchange", handleSelectionChange);
		return () =>
			document.removeEventListener("selectionchange", handleSelectionChange);
	}, [containerRef]);

	return selection;
}

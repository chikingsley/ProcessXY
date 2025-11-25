import { useEffect } from "react";

interface KeyboardShortcut {
	key: string;
	ctrlKey?: boolean;
	metaKey?: boolean;
	shiftKey?: boolean;
	handler: (e: KeyboardEvent) => void;
	description?: string;
}

export function useKeyboardShortcuts(
	shortcuts: KeyboardShortcut[],
	enabled = true,
) {
	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip shortcuts when typing in input fields
			const target = e.target as HTMLElement;
			const isInputField =
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable;

			if (isInputField) return;

			for (const shortcut of shortcuts) {
				const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
				const ctrlMatches =
					shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey;
				const metaMatches =
					shortcut.metaKey === undefined || e.metaKey === shortcut.metaKey;
				const shiftMatches =
					shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey;

				if (keyMatches && ctrlMatches && metaMatches && shiftMatches) {
					e.preventDefault();
					shortcut.handler(e);
					return;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts, enabled]);
}

// The editor's keys: Space plays or stops, Delete removes the selected block, ⌘Z / ⇧⌘Z undo and
// redo, ⌘S saves, Escape clears the selection. Keys typed into a field are left to the field.
import { useEffect, useRef } from 'react';

/** What the keys do. */
export type EditorKeys = {
  togglePlaying: () => void;
  removeSelected: () => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
  clearSelection: () => void;
};

/**
 * Listens to the editor's keys while the editor is on the page.
 *
 * @param keys - What each key does; the latest given is used.
 */
export function useEditorKeys(keys: EditorKeys): void {
  const latest = useRef(keys);
  useEffect(() => {
    latest.current = keys;
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      const isCommand = event.metaKey || event.ctrlKey;
      const now = latest.current;
      if (isCommand && event.key.toLowerCase() === 's') {
        event.preventDefault();
        now.save();
        return;
      }
      if (isTyping) return;
      if (isCommand && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) now.redo();
        else now.undo();
      } else if (event.key === ' ') {
        event.preventDefault();
        now.togglePlaying();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        now.removeSelected();
      } else if (event.key === 'Escape') {
        now.clearSelection();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

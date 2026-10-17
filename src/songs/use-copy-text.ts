// Copying a text from a button, and whether the last copy worked, for the button to show. It knows
// nothing of what the text is or how the button looks.
import { useState } from 'react';
import { copyText } from '../copy-text.ts';

/** What a copy button needs: whether the last copy worked, and the handler that copies. */
export type CopyTextState = {
  copyResult: boolean | null;
  copy: (text: string) => void;
};

/**
 * Keeps whether the last copy worked and gives the handler that copies a text.
 *
 * @returns Whether the last copy worked (null before the first), and the handler that copies.
 */
export function useCopyText(): CopyTextState {
  const [copyResult, setCopyResult] = useState<boolean | null>(null);
  function copy(text: string): void {
    void copyText(text).then(setCopyResult);
  }
  return { copyResult, copy };
}

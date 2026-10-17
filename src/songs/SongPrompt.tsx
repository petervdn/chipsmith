// The prompt a song was made from, on its page under the title: a few lines at first, with "more"
// to read all of it when it is longer, and a button to copy it.
import { Check, Copy, X } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import './SongPrompt.css';
import { useCopyText } from './use-copy-text.ts';

type SongPromptProps = { prompt: string };

/**
 * Shows a song's prompt, cut to a few lines until opened, with a button to copy it.
 *
 * @param props - The component's props.
 * @param props.prompt - The prompt the song was made from.
 * @returns The prompt's element, or null for a song without one.
 */
export function SongPrompt({ prompt }: SongPromptProps) {
  const [isOpen, setOpen] = useState(false);
  const [isCut, setCut] = useState(false);
  const { copyResult, copy } = useCopyText();
  const textRef = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const text = textRef.current;
    if (text && !isOpen) setCut(text.scrollHeight > text.clientHeight + 1);
  }, [prompt, isOpen]);
  if (!prompt.trim()) return null;
  return (
    <div className="song-prompt">
      <p ref={textRef} className={`song-prompt-text${isOpen ? ' is-open' : ''}`}>
        {prompt}
      </p>
      <div className="song-prompt-actions">
        {(isCut || isOpen) && (
          <button type="button" className="song-prompt-action" onClick={() => setOpen(!isOpen)}>
            {isOpen ? 'less' : 'more'}
          </button>
        )}
        <button
          type="button"
          className="song-prompt-action song-prompt-copy"
          onClick={() => copy(prompt)}
          aria-label="copy the prompt"
          data-tooltip={
            copyResult === null
              ? 'copy the prompt'
              : copyResult
                ? 'copied'
                : 'could not copy: select the text'
          }
        >
          {copyResult === null ? <Copy /> : copyResult ? <Check /> : <X />}
        </button>
      </div>
    </div>
  );
}

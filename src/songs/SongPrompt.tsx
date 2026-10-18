// The prompt a song was made from, on its page under the title: a few lines at first, with "more"
// to read all of it when it is longer, and a button to copy it after its last word (beside "more"
// while the end is cut off).
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
  const isEndHidden = isCut && !isOpen;
  const copyTooltip =
    copyResult === null
      ? 'copy the prompt'
      : copyResult
        ? 'copied'
        : 'could not copy: select the text';
  const copyIcon = copyResult === null ? <Copy /> : copyResult ? <Check /> : <X />;
  return (
    <div className="song-prompt">
      <p ref={textRef} className={`song-prompt-text${isOpen ? ' is-open' : ''}`}>
        {prompt.trimEnd()}{' '}
        <button
          type="button"
          className="song-prompt-action song-prompt-copy is-inline"
          onClick={() => copy(prompt)}
          aria-label="copy the prompt"
          aria-hidden={isEndHidden}
          tabIndex={isEndHidden ? -1 : undefined}
          data-tooltip={copyTooltip}
        >
          {copyIcon}
        </button>
      </p>
      {isEndHidden || isOpen ? (
        <div className="song-prompt-actions">
          <button type="button" className="song-prompt-action" onClick={() => setOpen(!isOpen)}>
            {isOpen ? 'less' : 'more'}
          </button>
          {isEndHidden && (
            <button
              type="button"
              className="song-prompt-action song-prompt-copy"
              onClick={() => copy(prompt)}
              aria-label="copy the prompt"
              data-tooltip={copyTooltip}
            >
              {copyIcon}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

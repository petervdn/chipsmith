// The prompt a song was made from, on its page under the title: a few lines at first, with "more"
// to read all of it when it is longer.
import { useLayoutEffect, useRef, useState } from 'react';
import './SongPrompt.css';

type SongPromptProps = { prompt: string };

/**
 * Shows a song's prompt, cut to a few lines until opened.
 *
 * @param props - The component's props.
 * @param props.prompt - The prompt the song was made from.
 * @returns The prompt's element, or null for a song without one.
 */
export function SongPrompt({ prompt }: SongPromptProps) {
  const [isOpen, setOpen] = useState(false);
  const [isCut, setCut] = useState(false);
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
      {(isCut || isOpen) && (
        <button type="button" className="song-prompt-more" onClick={() => setOpen(!isOpen)}>
          {isOpen ? 'less' : 'more'}
        </button>
      )}
    </div>
  );
}

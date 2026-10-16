// The box on the New page where a prompt is written and sent; the job it makes shows below it at once.
// Opened from a song's "Prompt again", it starts with that song's prompt and notes the song, until
// the note is cleared.
import { useState } from 'react';
import { sendPrompt } from './jobs-data.ts';

/** The song a prompt is sent again from: its id and title. */
export type PromptSource = { songId: string; title: string };

type PromptBoxProps = {
  initialText: string;
  source: PromptSource | null;
  onClearSource: () => void;
  onSent: () => void;
};

/** The prompt box. */
export function PromptBox({ initialText, source, onClearSource, onSent }: PromptBoxProps) {
  const [text, setText] = useState(initialText);
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(): Promise<void> {
    if (!text.trim() || isSending) return;
    setSending(true);
    setError(null);
    try {
      await sendPrompt(text, source?.songId ?? null);
      setText('');
      onClearSource();
      onSent();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className="prompt-box"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      {source && (
        <p className="prompt-source">
          Prompting again from{' '}
          <a href={`/songs/${encodeURIComponent(source.songId)}`}>{source.title}</a>
          <button
            type="button"
            className="prompt-source-clear"
            onClick={onClearSource}
            title="send it as a new prompt, not linked to that song"
          >
            ✕
          </button>
        </p>
      )}
      <textarea
        className="prompt-text"
        placeholder="What should Claude make? (e.g. three dark NES funk grooves in odd meters)"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void send();
        }}
      />
      <button type="submit" className="prompt-send" disabled={!text.trim() || isSending}>
        {isSending ? 'Sending…' : 'Make'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

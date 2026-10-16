// The box on the New page where a prompt is written and sent; the job it makes shows below it at once.
import { useState } from 'react';
import { sendPrompt } from './jobs-data.ts';

type PromptBoxProps = { onSent: () => void };

/** The prompt box. */
export function PromptBox({ onSent }: PromptBoxProps) {
  const [text, setText] = useState('');
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(): Promise<void> {
    if (!text.trim() || isSending) return;
    setSending(true);
    setError(null);
    try {
      await sendPrompt(text);
      setText('');
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

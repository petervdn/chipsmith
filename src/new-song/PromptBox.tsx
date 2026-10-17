// The box on the New page where a prompt is written (or made up at random) and sent, with the style
// guides chosen as chips; sending it leads to the Jobs page.
// Opened from a song's "Prompt again", it starts with that song's prompt and notes the song, until
// the note is cleared.
import { useState } from 'react';
import { GuideChips } from '../guides/GuideChips.tsx';
import { getRandomPrompt } from './random-prompt.ts';
import { useSendPrompt } from '../queries/jobs.ts';
import { navigate } from '../router.ts';
import { useGuideChoice } from '../guides/use-guide-choice.ts';
import '../lists/lists.css';
import './PromptBox.css';

/** The song a prompt is sent again from: its id, its title, and whether it changed after its prompt. */
export type PromptSource = { songId: string; title: string; isChangedAfterPrompt: boolean };

type PromptBoxProps = {
  initialText: string;
  source: PromptSource | null;
  onClearSource: () => void;
};

/** The prompt box. */
export function PromptBox({ initialText, source, onClearSource }: PromptBoxProps) {
  const [text, setText] = useState(initialText);
  const isFocusAtEnd = initialText.endsWith(': ');
  const { mutate: sendPrompt, isPending: isSending, error } = useSendPrompt();
  const { guides, chosenIds, toggleGuide, resetChoice } = useGuideChoice();

  function send(): void {
    if (!text.trim() || isSending) return;
    sendPrompt(
      { prompt: text, fromSong: source?.songId ?? null, guideIds: chosenIds },
      {
        onSuccess: () => {
          setText('');
          resetChoice();
          onClearSource();
          navigate('/jobs');
        },
      },
    );
  }

  return (
    <form
      className="prompt-box"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {source && (
        <p className="prompt-box-source">
          Prompting again from{' '}
          <a href={`/songs/${encodeURIComponent(source.songId)}`}>{source.title}</a>
          <button
            type="button"
            className="prompt-box-source-clear"
            onClick={onClearSource}
            title="send it as a new prompt, not linked to that song"
          >
            ✕
          </button>
        </p>
      )}
      {source?.isChangedAfterPrompt && (
        <p className="list-warning">
          ⚠ That song changed after this prompt; sending it again makes it as it first was asked.
        </p>
      )}
      <textarea
        autoFocus={isFocusAtEnd}
        onFocus={(event) => {
          if (isFocusAtEnd) event.target.setSelectionRange(text.length, text.length);
        }}
        className="prompt-box-text"
        placeholder="What should Claude make? (e.g. three dark NES funk grooves in odd meters)"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) send();
        }}
      />
      <div className="prompt-box-tools">
        <button
          type="button"
          className="prompt-box-random"
          onClick={() => setText(getRandomPrompt(Math.random))}
          title="fill the box with a prompt made up at random (nothing is sent)"
        >
          🎲 Random prompt
        </button>
      </div>
      <GuideChips guides={guides} chosenIds={chosenIds} onToggle={toggleGuide} />
      <button type="submit" className="prompt-box-send" disabled={!text.trim() || isSending}>
        {isSending ? 'Sending…' : 'Create song'}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}

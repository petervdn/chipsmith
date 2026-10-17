// The box on the New page where a prompt is written (or built from parts, PromptBuilder.tsx) and
// sent, with the style guides chosen as chips; sending it leads to the Jobs page.
// Opened from a song's "Prompt again", it starts with that song's prompt and notes the song, until
// the note is cleared.
import { useState } from 'react';
import { GuideChips } from '../guides/GuideChips.tsx';
import { PromptBuilder } from './PromptBuilder.tsx';
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

/**
 * Shows the box where a prompt is written (or made up at random) and sent with the style guides
 * chosen; a sent prompt leads to the Jobs page.
 *
 * @param props - The component's props.
 * @param props.initialText - The text the box starts with; the cursor goes to its end when it ends
 *   in ": ".
 * @param props.source - The song the prompt is sent again from, or null.
 * @param props.onClearSource - Called when the note of the song is cleared, and after a prompt is
 *   sent.
 * @returns The box's form element.
 */
export function PromptBox({ initialText, source, onClearSource }: PromptBoxProps) {
  const [text, setText] = useState(initialText);
  const [isBuilding, setBuilding] = useState(false);
  const [usedText, setUsedText] = useState('');
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
          className={`prompt-box-random${isBuilding ? ' is-on' : ''}`}
          onClick={() => setBuilding(!isBuilding)}
          aria-expanded={isBuilding}
          title="build a prompt from parts, rolled at random or picked (nothing is sent)"
        >
          🎲 Build a prompt
        </button>
      </div>
      {isBuilding && (
        <PromptBuilder
          onUse={(built) => {
            const isOwnText = text.trim() !== '' && text !== usedText;
            if (isOwnText && !window.confirm('Replace what is in the box with this prompt?')) {
              return;
            }
            setText(built);
            setUsedText(built);
          }}
        />
      )}
      <GuideChips guides={guides} chosenIds={chosenIds} onToggle={toggleGuide} />
      <button type="submit" className="prompt-box-send" disabled={!text.trim() || isSending}>
        {isSending ? 'Sending…' : 'Create song'}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}

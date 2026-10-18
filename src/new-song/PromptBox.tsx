// The box on the New page where a prompt is written (or built from parts, PromptBuilder.tsx) and
// sent, with the structure, the harmony and the style guides chosen; sending it leads to the Jobs
// page.
// Opened from a song's "Prompt again", it starts with that song's prompt and notes the song, until
// the note is cleared.
import { X } from 'lucide-react';
import { useState } from 'react';
import { GuideChips } from '../guides/GuideChips.tsx';
import { CreatePanel } from './CreatePanel.tsx';
import { PromptBuilder } from './PromptBuilder.tsx';
import { HarmonyPanel } from './HarmonyPanel.tsx';
import { StructurePanel } from './StructurePanel.tsx';
import { useHarmonyChoice } from './use-harmony-choice.ts';
import { useStructureChoice } from './use-structure-choice.ts';
import { useSendPrompt } from '../queries/jobs.ts';
import { navigate } from '../router.ts';
import { useGuideChoice } from '../guides/use-guide-choice.ts';
import '../lists/lists.css';
import './PromptBox.css';
import { askToConfirm } from '../stores/confirm-store.ts';

/** The song a prompt is sent again from: its id, its title, and whether it changed after its prompt. */
export type PromptSource = { songId: string; title: string; isChangedAfterPrompt: boolean };

/** How many songs a prompt makes to start with. */
const DEFAULT_SONGS = 1;

/** The example in the empty box's placeholder. */
const PROMPT_EXAMPLE = 'a dark NES funk groove in 7/8, the bass doing most of the work';

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
  const [songCount, setSongCount] = useState(DEFAULT_SONGS);
  const isFocusAtEnd = initialText.endsWith(': ');
  const { mutate: sendPrompt, isPending: isSending, error } = useSendPrompt();
  const { guides, chosenIds, toggleGuide, resetChoice } = useGuideChoice();
  const structureChoice = useStructureChoice();
  const harmonyChoice = useHarmonyChoice(structureChoice.sent?.sections ?? null);

  function send(): void {
    if (!text.trim() || isSending) return;
    sendPrompt(
      {
        prompt: text,
        fromSong: source?.songId ?? null,
        guideIds: chosenIds,
        structure: structureChoice.sent,
        harmony: harmonyChoice.sent,
        songCount,
      },
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
            data-tooltip="send it as a new prompt, not linked to that song"
            aria-label="send it as a new prompt, not linked to that song"
          >
            <X />
          </button>
        </p>
      )}
      {source?.isChangedAfterPrompt && (
        <p className="list-warning">
          ⚠ That song changed after this prompt; sending it again makes it as it first was asked.
        </p>
      )}
      <div className="prompt-box-body">
        <div className="prompt-box-main">
          {error && <p className="error">{error.message}</p>}
          <div className="prompt-box-field">
            <textarea
              autoFocus={isFocusAtEnd}
              onFocus={(event) => {
                if (isFocusAtEnd) event.target.setSelectionRange(text.length, text.length);
              }}
              className="prompt-box-text"
              aria-label="Describe what Claude should create"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) send();
              }}
            />
            {text === '' && (
              <p className="prompt-box-placeholder" aria-hidden="true">
                Describe what Claude should create, e.g. <em>“{PROMPT_EXAMPLE}”</em>
                <br />
                Or build one from parts below.
              </p>
            )}
          </div>
          <PromptBuilder
            isOpen={isBuilding}
            onToggle={() => setBuilding(!isBuilding)}
            onUse={async (built) => {
              const isOwnText = text.trim() !== '' && text !== usedText;
              const question = 'Replace what is in the box with this prompt?';
              if (isOwnText && !(await askToConfirm({ question, answer: 'Replace' }))) return;
              setText(built);
              setUsedText(built);
            }}
          />
          <StructurePanel choice={structureChoice} />
          <HarmonyPanel choice={harmonyChoice} />
          <GuideChips guides={guides} chosenIds={chosenIds} onToggle={toggleGuide} />
        </div>
        <CreatePanel
          songCount={songCount}
          canSend={text.trim() !== ''}
          isSending={isSending}
          onSongCountChange={setSongCount}
        />
      </div>
    </form>
  );
}

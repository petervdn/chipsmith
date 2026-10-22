// Create on the New page, with how many songs under it, small, and the model Claude composes with:
// the column at the right of the prompt, staying in view as the page scrolls.
import { Minus, Plus } from 'lucide-react';
import type { ComposerModel } from '../../shared/composer-models.ts';
import { COMPOSER_MODEL_FACTS, COMPOSER_MODELS } from '../../shared/composer-models.ts';
import './CreatePanel.css';

/** The most songs a prompt can make. */
const MOST_SONGS = 6;

type CreatePanelProps = {
  songCount: number;
  model: ComposerModel;
  canSend: boolean;
  isSending: boolean;
  onSongCountChange: (songCount: number) => void;
  onModelChange: (model: ComposerModel) => void;
};

/**
 * Shows Create, which sends the prompt (its form's submit), the number of songs under it and the
 * model to compose with.
 *
 * @param props - The component's props.
 * @param props.songCount - How many songs the prompt makes.
 * @param props.model - The model Claude composes with.
 * @param props.canSend - Whether there is a prompt to send.
 * @param props.isSending - Whether it is being sent.
 * @param props.onSongCountChange - Called with a new number of songs, 1 to MOST_SONGS.
 * @param props.onModelChange - Called with the model chosen.
 * @returns The panel's element.
 */
export function CreatePanel({
  songCount,
  model,
  canSend,
  isSending,
  onSongCountChange,
  onModelChange,
}: CreatePanelProps) {
  return (
    <div className="create-panel">
      <button type="submit" className="create-panel-send" disabled={!canSend || isSending}>
        {isSending ? 'Sending…' : `Create ${songCount} ${songCount === 1 ? 'song' : 'songs'}`}
      </button>
      <span className="create-panel-count" aria-label="how many songs">
        <button
          type="button"
          onClick={() => onSongCountChange(Math.max(1, songCount - 1))}
          disabled={songCount <= 1}
          data-tooltip="one song fewer"
          aria-label="one song fewer"
        >
          <Minus />
        </button>
        <span className="create-panel-count-number">{songCount}</span>
        <button
          type="button"
          onClick={() => onSongCountChange(Math.min(MOST_SONGS, songCount + 1))}
          disabled={songCount >= MOST_SONGS}
          data-tooltip="one song more"
          aria-label="one song more"
        >
          <Plus />
        </button>
      </span>
      <span className="create-panel-models" role="radiogroup" aria-label="the model that composes">
        {COMPOSER_MODELS.map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={each === model}
            className={each === model ? 'is-on' : undefined}
            onClick={() => onModelChange(each)}
            data-tooltip={`compose with ${COMPOSER_MODEL_FACTS[each].name}: ${COMPOSER_MODEL_FACTS[each].about}`}
          >
            {COMPOSER_MODEL_FACTS[each].name}
          </button>
        ))}
      </span>
    </div>
  );
}

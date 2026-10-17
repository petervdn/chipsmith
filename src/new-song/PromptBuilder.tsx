// The prompt builder under the prompt box: a bar the width of the box that opens and closes it, and
// in it the sentence the parts make, large at the top, with 🎲 Roll for the unlocked parts and Use ↑
// at its right (beside it, so they stay put as it changes length), and under it a row per part of a
// prompt (its value to pick, a lock), the chips first as switches, one or more on. Use puts the
// sentence in the box; the box is written to only by that button, so what is typed there afterwards
// is the box's own.
import { CHIP_NAMES, CHIPS } from '../../shared/chips.ts';
import { LockIcon } from './LockIcon.tsx';
import type { PartName } from './random-prompt.ts';
import { PROMPT_PARTS } from './random-prompt.ts';
import '../lists/lists.css';
import { usePromptBuilder } from './use-prompt-builder.ts';
import './PromptBuilder.css';

type PromptBuilderProps = { isOpen: boolean; onToggle: () => void; onUse: (text: string) => void };

/**
 * Shows the prompt builder: its bar, and under it the builder while it is open. What was picked
 * stays while it is closed.
 *
 * @param props - The component's props.
 * @param props.isOpen - Whether it is open.
 * @param props.onToggle - Called when the bar is pressed.
 * @param props.onUse - Called with the sentence when Use is pressed.
 * @returns The builder's section element.
 */
export function PromptBuilder({ isOpen, onToggle, onUse }: PromptBuilderProps) {
  const { parts, locked, text, roll, pick, toggleChip, toggleLock } = usePromptBuilder();
  function renderLock(name: PartName) {
    const isLocked = locked.includes(name);
    return (
      <button
        type="button"
        className={`prompt-builder-lock${isLocked ? ' is-on' : ''}`}
        onClick={() => toggleLock(name)}
        aria-pressed={isLocked}
        data-tooltip={isLocked ? 'locked: Roll keeps it' : 'unlocked: Roll picks it again'}
      >
        <LockIcon isLocked={isLocked} />
      </button>
    );
  }
  return (
    <section className={`prompt-builder${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="prompt-builder-bar"
        onClick={onToggle}
        aria-expanded={isOpen}
        data-tooltip={isOpen ? 'close the builder' : 'build a prompt from parts (nothing is sent)'}
      >
        <span className="prompt-builder-bar-label">🎲 Build a prompt</span>
        <span className="prompt-builder-bar-hint">from parts, rolled at random or picked</span>
        <span className="prompt-builder-bar-arrow" aria-hidden="true">
          ▸
        </span>
      </button>
      {isOpen && (
        <div className="prompt-builder-body">
          <div className="prompt-builder-result">
            <p className="prompt-builder-text">{text}</p>
            <div className="prompt-builder-actions">
              <button type="button" onClick={roll} data-tooltip="pick the unlocked parts again">
                🎲 Roll
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => onUse(text)}
                data-tooltip="use as the prompt: put this sentence in the box above"
              >
                Use ↑
              </button>
            </div>
          </div>
          <div className="prompt-builder-rows">
            <div className="prompt-builder-row is-chips">
              <span className="prompt-builder-label">Chips</span>
              <span className="prompt-builder-chips">
                {CHIP_NAMES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`list-chip${parts.chips.includes(chip) ? ' is-on' : ''}`}
                    onClick={() => toggleChip(chip)}
                    aria-pressed={parts.chips.includes(chip)}
                    data-tooltip="switch this chip on or off (one stays on)"
                  >
                    {CHIPS[chip].label}
                  </button>
                ))}
              </span>
              {renderLock('chips')}
            </div>
            {PROMPT_PARTS.map(({ name, label, values }) => {
              return (
                <div key={name} className="prompt-builder-row">
                  <span className="prompt-builder-label">{label}</span>
                  <select
                    className="prompt-builder-value"
                    value={parts[name]}
                    onChange={(event) => pick(name, event.target.value)}
                    aria-label={label}
                  >
                    {values.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {renderLock(name)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

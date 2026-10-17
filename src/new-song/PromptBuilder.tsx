// The prompt builder under the prompt box: always the sentence the parts make, large, with 🎲 Roll
// for the unlocked parts, Use ↑ and ▸ at its right (beside it, so they stay put as it changes
// length); ▸ opens under them a row per part of a prompt (its value to pick, a lock), the chips first
// as switches, one or more on, and closes it again, the sentence staying where it is. Use puts the
// sentence in the box; the box is written to only by that button, so what is typed there afterwards
// is the box's own.
import { CHIP_NAMES, CHIPS } from '../../shared/chips.ts';
import { ArrowUp, ChevronRight, Dices, Lock, LockOpen } from 'lucide-react';
import type { PartName } from './random-prompt.ts';
import { getPartValues, PROMPT_PARTS } from './random-prompt.ts';
import '../lists/lists.css';
import { usePromptBuilder } from './use-prompt-builder.ts';
import './PromptBuilder.css';

/** How large the locks are drawn, in pixels. */
const ICON_SIZE = 14;

type PromptBuilderProps = { isOpen: boolean; onToggle: () => void; onUse: (text: string) => void };

/**
 * Shows the prompt builder: its sentence with Roll, Use and ▸, and under them its parts while it is
 * open. What was picked stays while it is closed.
 *
 * @param props - The component's props.
 * @param props.isOpen - Whether it is open.
 * @param props.onToggle - Called when ▸ is pressed, to show or hide the parts.
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
        aria-label={isLocked ? 'locked: Roll keeps it' : 'unlocked: Roll picks it again'}
      >
        {isLocked ? <Lock size={ICON_SIZE} /> : <LockOpen size={ICON_SIZE} />}
      </button>
    );
  }
  return (
    <section className={`prompt-builder${isOpen ? ' is-open' : ''}`}>
      <div className="prompt-builder-result">
        <div className="prompt-builder-sentence">
          <span className="prompt-builder-heading">
            <Dices /> build a prompt
          </span>
          <p className="prompt-builder-text">{text}</p>
        </div>
        <div className="prompt-builder-actions">
          <button type="button" onClick={roll} data-tooltip="pick the unlocked parts again">
            <Dices /> Roll
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => onUse(text)}
            data-tooltip="use as the prompt: put this sentence in the box above"
          >
            Use <ArrowUp />
          </button>
          <button
            type="button"
            className="prompt-builder-toggle"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'hide the parts' : 'show the parts'}
            data-tooltip={
              isOpen ? 'hide the parts' : 'show the parts: pick each, or lock it from Roll'
            }
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      {isOpen && (
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
          {PROMPT_PARTS.map(({ name, label }) => {
            return (
              <div key={name} className="prompt-builder-row">
                <span className="prompt-builder-label">{label}</span>
                <select
                  className="prompt-builder-value"
                  value={parts[name]}
                  onChange={(event) => pick(name, event.target.value)}
                  aria-label={label}
                >
                  {getPartValues(name, parts).map((value) => (
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
      )}
    </section>
  );
}

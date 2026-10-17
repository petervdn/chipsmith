// The prompt builder under the prompt box: always the sentence the parts make, large, with 🎲 Roll
// for the unlocked parts, Use ↑ and ▸ at its right (beside it, so they stay put as it changes
// length); ▸ opens under them a row per part of a prompt (its value to pick, a lock), the chips first
// as switches, one or more on, and closes it again, the sentence staying where it is. Use puts the
// sentence in the box; the box is written to only by that button, so what is typed there afterwards
// is the box's own.
import { CHIP_NAMES, CHIPS } from '../../shared/chips.ts';
import { ArrowUp, Dices } from 'lucide-react';
import { getPartValues, PROMPT_PARTS } from './random-prompt.ts';
import '../lists/lists.css';
import { usePromptBuilder } from './use-prompt-builder.ts';
import { FoldPanel } from './FoldPanel.tsx';
import { PartRow } from './PartRow.tsx';
import './PromptBuilder.css';

type PromptBuilderProps = { isOpen: boolean; onToggle: () => void; onUse: (text: string) => void };

/**
 * Shows the prompt builder: its sentence with Roll, Use and ▸, and under them its parts while it is
 * open. What was picked stays while it is closed.
 *
 * @param props - The component's props.
 * @param props.isOpen - Whether it is open.
 * @param props.onToggle - Called when ▸ is pressed, to show or hide the parts.
 * @param props.onUse - Called with the sentence when Use is pressed.
 * @returns The builder's panel.
 */
export function PromptBuilder({ isOpen, onToggle, onUse }: PromptBuilderProps) {
  const { parts, locked, text, roll, rollOne, pick, toggleChip, toggleLock } = usePromptBuilder();
  return (
    <FoldPanel
      label="Build a prompt"
      summary={<p className="prompt-builder-text">{text}</p>}
      actions={
        <>
          <button
            type="button"
            className="prompt-builder-button"
            onClick={roll}
            data-tooltip="pick the unlocked parts again"
          >
            <Dices /> Roll
          </button>
          <button
            type="button"
            className="prompt-builder-button is-primary"
            onClick={() => onUse(text)}
            data-tooltip="use as the prompt: put this sentence in the box above"
          >
            Use <ArrowUp />
          </button>
        </>
      }
      isOpen={isOpen}
      onToggle={onToggle}
      toggleLabels={{
        open: 'hide the parts',
        closed: 'show the parts: pick each, or lock it from Roll',
      }}
    >
      <div className="prompt-builder-rows">
        <PartRow
          label="Chips"
          name="chips"
          className="is-chips"
          isLocked={locked.includes('chips')}
          onRoll={() => rollOne('chips')}
          onToggleLock={() => toggleLock('chips')}
        >
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
        </PartRow>
        {PROMPT_PARTS.map(({ name, label }) => (
          <PartRow
            key={name}
            label={label}
            name={label.toLowerCase()}
            isLocked={locked.includes(name)}
            onRoll={() => rollOne(name)}
            onToggleLock={() => toggleLock(name)}
          >
            <select
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
          </PartRow>
        ))}
      </div>
    </FoldPanel>
  );
}

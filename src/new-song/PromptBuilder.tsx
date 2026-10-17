// The prompt builder under the prompt box: a bar the width of the box that opens and closes it, and
// in it a row per part of a prompt (its value to pick, a lock),
// 🎲 Roll for the unlocked parts and "Use as prompt" (above the sentence, so they stay put as it
// changes length), and the sentence they make. "Use as prompt" puts the sentence in the box; the box
// is written to only by that button, so what is typed there afterwards is the box's own.
import { LockIcon } from './LockIcon.tsx';
import { PROMPT_PARTS } from './random-prompt.ts';
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
 * @param props.onUse - Called with the sentence when "Use as prompt" is pressed.
 * @returns The builder's section element.
 */
export function PromptBuilder({ isOpen, onToggle, onUse }: PromptBuilderProps) {
  const { parts, locked, text, roll, pick, toggleLock } = usePromptBuilder();
  return (
    <section className={`prompt-builder${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="prompt-builder-bar"
        onClick={onToggle}
        aria-expanded={isOpen}
        title={isOpen ? 'close the builder' : 'build a prompt from parts (nothing is sent)'}
      >
        <span className="prompt-builder-bar-label">🎲 Build a prompt</span>
        <span className="prompt-builder-bar-hint">from parts, rolled at random or picked</span>
        <span className="prompt-builder-bar-arrow" aria-hidden="true">
          ▸
        </span>
      </button>
      {isOpen && (
        <div className="prompt-builder-body">
          <div className="prompt-builder-rows">
            {PROMPT_PARTS.map(({ name, label, values }) => {
              const isLocked = locked.includes(name);
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
                  <button
                    type="button"
                    className={`prompt-builder-lock${isLocked ? ' is-on' : ''}`}
                    onClick={() => toggleLock(name)}
                    aria-pressed={isLocked}
                    title={isLocked ? 'locked: Roll keeps it' : 'unlocked: Roll picks it again'}
                  >
                    <LockIcon isLocked={isLocked} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="prompt-builder-actions">
            <button type="button" onClick={roll} title="pick the unlocked parts again">
              🎲 Roll
            </button>
            <button type="button" className="is-primary" onClick={() => onUse(text)}>
              Use as prompt ↑
            </button>
          </div>
          <p className="prompt-builder-text">{text}</p>
        </div>
      )}
    </section>
  );
}

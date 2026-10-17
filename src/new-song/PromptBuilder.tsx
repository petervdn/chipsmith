// The prompt builder under the prompt box: a row per part of a prompt (its value to pick, a lock),
// the sentence they make, 🎲 Roll for the unlocked parts, and "Use as prompt", which puts the
// sentence in the box. The box is written to only by that button: what is typed there afterwards is
// the box's own.
import { PROMPT_PARTS } from './random-prompt.ts';
import { usePromptBuilder } from './use-prompt-builder.ts';
import './PromptBuilder.css';

type PromptBuilderProps = { onUse: (text: string) => void };

/**
 * Shows the prompt builder.
 *
 * @param props - The component's props.
 * @param props.onUse - Called with the sentence when "Use as prompt" is pressed.
 * @returns The builder's section element.
 */
export function PromptBuilder({ onUse }: PromptBuilderProps) {
  const { parts, locked, text, roll, pick, toggleLock } = usePromptBuilder();
  return (
    <section className="prompt-builder">
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
                {isLocked ? '🔒' : '🔓'}
              </button>
            </div>
          );
        })}
      </div>
      <p className="prompt-builder-text">{text}</p>
      <div className="prompt-builder-actions">
        <button type="button" onClick={roll} title="pick the unlocked parts again">
          🎲 Roll
        </button>
        <button type="button" className="is-primary" onClick={() => onUse(text)}>
          Use as prompt ↑
        </button>
      </div>
    </section>
  );
}

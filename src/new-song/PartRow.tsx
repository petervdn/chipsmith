// A row of a panel on New that is rolled at random (the prompt builder, the harmony): a small label
// above what is chosen, with a die that picks it again and a lock that keeps it from Roll. It knows
// nothing of what is chosen.
import { Dices, Lock, LockOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import './PartRow.css';

type PartRowProps = {
  label: ReactNode;
  name: string;
  className?: string;
  isLocked: boolean;
  onRoll: () => void;
  onToggleLock: () => void;
  children: ReactNode;
};

/**
 * Shows a row: its label, what is chosen, its die and its lock.
 *
 * @param props - The component's props.
 * @param props.label - What the row is ("Mood"), above what is chosen.
 * @param props.name - What the row is in words, for its die's tooltip ("mood").
 * @param props.className - A class added to the row's own, or none.
 * @param props.isLocked - Whether Roll keeps what is chosen.
 * @param props.onRoll - Called when the die is pressed, to pick it again.
 * @param props.onToggleLock - Called when the lock is pressed.
 * @param props.children - What is chosen, and what changes it (a menu, switches).
 * @returns The row's div element.
 */
export function PartRow({
  label,
  name,
  className,
  isLocked,
  onRoll,
  onToggleLock,
  children,
}: PartRowProps) {
  const lockLabel = isLocked ? 'locked: Roll keeps it' : 'unlocked: Roll picks it again';
  return (
    <div className={`part-row${className ? ` ${className}` : ''}`}>
      <span className="part-row-label">{label}</span>
      <div className="part-row-value">{children}</div>
      <button
        type="button"
        className="part-row-dice"
        onClick={onRoll}
        data-tooltip={`roll the ${name} again`}
        aria-label={`roll the ${name} again`}
      >
        <Dices />
      </button>
      <button
        type="button"
        className={`part-row-lock${isLocked ? ' is-on' : ''}`}
        onClick={onToggleLock}
        aria-pressed={isLocked}
        data-tooltip={lockLabel}
        aria-label={lockLabel}
      >
        {isLocked ? <Lock /> : <LockOpen />}
      </button>
    </div>
  );
}

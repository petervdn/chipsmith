// A small padlock drawn in the text colour: shut for a part the builder keeps, open for one it rolls.

type LockIconProps = { isLocked: boolean };

/**
 * Draws a padlock.
 *
 * @param props - The component's props.
 * @param props.isLocked - Whether it is shut.
 * @returns The padlock's svg element.
 */
export function LockIcon({ isLocked }: LockIconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="7" width="11" height="8" rx="1.5" fill="currentColor" />
      <path
        d={isLocked ? 'M5 7V5a3 3 0 0 1 6 0v2' : 'M5 7V5a3 3 0 0 1 5.8-1'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

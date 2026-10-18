// A bar under the top bar on every page when a program the app calls cannot be used: which, what it
// is needed for, the path tried and why, and which setting points to it; with "Check again".
import { useCheckProgramsAgain, usePrograms } from './queries/programs.ts';
import './ProgramWarning.css';

/**
 * Shows the warning bar when a program the app calls is missing.
 *
 * @returns The warning bar element, or null when every program can be used.
 */
export function ProgramWarning() {
  const { data: checks } = usePrograms();
  const { mutate: checkAgain, isPending } = useCheckProgramsAgain();
  const missing = (checks ?? []).filter((check) => check.error);
  if (missing.length === 0) return null;
  return (
    <div className="program-warning" role="alert">
      {missing.map(({ name, path, variable, neededFor, error }) => (
        <p key={name}>
          <strong>
            No {name} for {neededFor}:
          </strong>{' '}
          {path} ({error}). Set <code>{variable}</code> in <code>.env</code>.
        </p>
      ))}
      <button type="button" onClick={() => checkAgain()} disabled={isPending}>
        {isPending ? 'Checking…' : 'Check again'}
      </button>
    </div>
  );
}

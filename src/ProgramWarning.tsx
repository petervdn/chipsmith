// A bar under the top bar on every page when a program the app calls cannot be used: which, what it
// is needed for, the path tried and why, and which setting points to it; with "Check again".
import { useCheckProgramsAgain, usePrograms } from './queries/programs.ts';
import './ProgramWarning.css';

/** The warning bar, shown only when a program is missing. */
export function ProgramWarning() {
  const { data: checks } = usePrograms();
  const { mutate: checkAgain, isPending } = useCheckProgramsAgain();
  const missing = (checks ?? []).filter((check) => check.error);
  if (missing.length === 0) return null;
  return (
    <div className="program-warning" role="alert">
      {missing.map(({ name, path, neededFor, error }) => (
        <p key={name}>
          <strong>
            No {name} for {neededFor}:
          </strong>{' '}
          {path} ({error}). Set <code>CHIPSMITH_{name.toUpperCase()}</code> in <code>.env</code>.
        </p>
      ))}
      <button type="button" onClick={() => checkAgain()} disabled={isPending}>
        {isPending ? 'Checking…' : 'Check again'}
      </button>
    </div>
  );
}

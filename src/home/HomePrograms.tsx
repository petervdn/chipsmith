// What the app needs, as the server found it: each program it calls with its version, or why it
// cannot be used and the setting that points to it; with "Check again".
import { Check, X } from 'lucide-react';
import type { ProgramName } from '../../shared/api.types.ts';
import { useCheckProgramsAgain, usePrograms } from '../queries/programs.ts';
import './HomePrograms.css';

/** Each program the app calls, by the name it is known by. */
const PROGRAM_LABELS = {
  node: 'Node',
  furnace: 'Furnace',
  furnaceApp: 'Furnace app',
  ffmpeg: 'ffmpeg',
  claude: 'Claude Code',
} satisfies Record<ProgramName, string>;

/**
 * Shows the programs the app calls, as the server last checked them.
 *
 * @returns The programs' list element, with the button that checks them again.
 */
export function HomePrograms() {
  const { data: checks, error } = usePrograms();
  const { mutate: checkAgain, isPending } = useCheckProgramsAgain();
  return (
    <div className="home-programs">
      {error && <p className="error">{error.message}</p>}
      <ul className="home-programs-list">
        {(checks ?? []).map(({ name, version, error: problem, variable, neededFor }) => (
          <li key={name} className={`home-programs-row${problem ? ' is-missing' : ''}`}>
            {problem ? <X /> : <Check />}
            <span className="home-programs-name">{PROGRAM_LABELS[name]}</span>
            <span className="home-programs-state">
              {problem ? (
                <>
                  {problem}: set <code>{variable}</code>
                </>
              ) : (
                (version ?? 'found')
              )}
            </span>
            <span className="home-programs-for">{neededFor}</span>
          </li>
        ))}
      </ul>
      <p className="home-page-note">
        Claude Code also has to be logged in: run <code>claude</code>, then <code>/login</code>.
      </p>
      <button type="button" onClick={() => checkAgain()} disabled={isPending}>
        {isPending ? 'Checking…' : 'Check again'}
      </button>
    </div>
  );
}

// What the app needs: each program it runs, as the server last looked for it (when it started, or
// when asked here): its version, or why it cannot be used and the setting that points to it; and a
// button to look for them again, beside when it last looked and what it found.
import { Check, RefreshCw, X } from 'lucide-react';
import type { ProgramName } from '../../shared/api.types.ts';
import { formatTime } from '../format.ts';
import { useCheckProgramsAgain, usePrograms } from '../queries/programs.ts';
import './HomePrograms.css';

/** Each program the app runs, by the name it is known by. */
const PROGRAM_LABELS = {
  node: 'Node',
  furnace: 'Furnace',
  furnaceApp: 'Furnace app',
  ffmpeg: 'ffmpeg',
  claude: 'Claude Code',
} satisfies Record<ProgramName, string>;

/**
 * Shows the programs the app runs, as the server last looked for them.
 *
 * @returns The programs' element: a line on what they are, a row each, and looking again.
 */
export function HomePrograms() {
  const { data: checks, error } = usePrograms();
  const { mutate: checkAgain, isPending } = useCheckProgramsAgain();
  const missingCount = (checks ?? []).filter((check) => check.error).length;
  const lastCheckedAt = checks
    ?.map((check) => check.checkedAt)
    .sort()
    .at(-1);
  return (
    <div className="home-programs">
      <p className="home-page-note">
        The programs chipsmith runs. The server looks for them when it starts; after installing one
        or changing a setting, look again.
      </p>
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
      <div className="home-programs-again">
        <button type="button" onClick={() => checkAgain()} disabled={isPending}>
          <RefreshCw className={isPending ? 'icon-spin' : undefined} />
          {isPending ? 'Looking…' : 'Look again'}
        </button>
        {checks && lastCheckedAt && !isPending && (
          <span className="home-page-note">
            Looked at {formatTime(lastCheckedAt)}:{' '}
            {missingCount === 0
              ? `all ${checks.length} found`
              : `${missingCount} of ${checks.length} missing`}
          </span>
        )}
      </div>
    </div>
  );
}

// What the app needs: each program it runs, as the server last looked for it (when it started, or
// when asked here), what it is for, and the version found, or why it cannot be used and the setting
// that points to it; why there are two Furnaces when there are; and a button to look for them
// again, beside when it last looked and what it found.
import { Check, RefreshCw, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatTime } from '../format.ts';
import { getProgramRows, hasTwoFurnaces } from './program-rows.ts';
import { HEADLESS_FURNACE_URL } from '../project-links.ts';
import { useCheckProgramsAgain, usePrograms } from '../queries/programs.ts';
import './HomePrograms.css';

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
      <table className="home-programs-table">
        <thead>
          <tr>
            <th aria-label="found" />
            <th>Program</th>
            <th>Version found</th>
          </tr>
        </thead>
        <tbody>
          {getProgramRows(checks ?? []).map(
            ({ name, label, version, error: problem, variable, neededFor }) => (
              <tr key={name} className={problem ? 'is-missing' : undefined}>
                <td>{problem ? <X aria-label="missing" /> : <Check aria-label="found" />}</td>
                <td>
                  <span className="home-programs-name">{label}</span>
                  <span className="home-programs-note">for {getWithFileNames(neededFor)}</span>
                  {problem && (
                    <span className="home-programs-problem">
                      {problem}: set <code>{variable}</code>
                    </span>
                  )}
                </td>
                <td className="home-programs-version">{problem ? 'missing' : (version ?? '?')}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      {checks && hasTwoFurnaces(checks) && (
        <p className="home-page-note">
          Two Furnaces are set here. The renderer turns the songs into audio: a build of its own (
          <code>CHIPSMITH_FURNACE</code>), best one without its window,{' '}
          <a href={HEADLESS_FURNACE_URL} target="_blank" rel="noreferrer">
            as the README shows
          </a>
          . The app opens a clip's <code>.fur</code> for you to look at (
          <code>CHIPSMITH_FURNACE_APP</code>). With only the Furnace app installed, it does both and
          is one row.
        </p>
      )}
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

/**
 * Returns a text with the file names in it (`.fur`) set as code.
 *
 * @param text - The text, as the server gives it.
 * @returns The text's parts, each file name a code element.
 */
function getWithFileNames(text: string): ReactNode[] {
  return text
    .split(/(\.fur\b)/)
    .map((part, i) => (part === '.fur' ? <code key={i}>{part}</code> : part));
}

// The bar at the top of every page: the logo (home), Songs, Guides, References and Jobs (with how
// many are on their way, turning while one runs; the one open marked), a
// button for a new song at the right, a link to the source on GitHub and the switch between light
// and dark; always in the dark look.
import { CodeXml, Plus } from 'lucide-react';
import { useRef } from 'react';
import type { Job } from '../../shared/job.schema.ts';
import { Logo } from './Logo.tsx';
import { LookSwitcher } from './LookSwitcher.tsx';
import { isJobRunning } from '../queries/jobs.ts';
import { useHeightProperty } from '../use-height-property.ts';
import type { Route } from '../router.ts';
import '../jobs/jobs.css';
import './TopBar.css';

const LOGO_SIZE = 32;
const SOURCE_URL = 'https://github.com/petervdn/chipsmith';

type TopBarProps = { route: Route; jobs: Job[] };

/**
 * Shows the top bar.
 *
 * @param props - The component's props.
 * @param props.route - The page open, whose tab is marked (and, in a song, whose title is shown).
 * @param props.jobs - Every job, for the Jobs tab's count and whether it turns.
 * @returns The top bar's header element.
 */
export function TopBar({ route, jobs }: TopBarProps) {
  const isSongs = route.page === 'songs' || route.page === 'song';
  const isReferences = route.page === 'references' || route.page === 'reference';
  const runningCount = jobs.filter(isJobRunning).length;
  const barRef = useRef<HTMLElement>(null);
  useHeightProperty(barRef, '--top-bar-height');
  return (
    <header ref={barRef} className="top-bar">
      <a href="/" className="top-bar-logo">
        <Logo size={LOGO_SIZE} />
        <span className="top-bar-logo-name">chipsmith</span>
      </a>
      <nav className="top-bar-nav">
        <a href="/songs" className={`top-bar-link${isSongs ? ' is-on' : ''}`}>
          Songs
        </a>
        <a href="/guides" className={`top-bar-link${route.page === 'guides' ? ' is-on' : ''}`}>
          Guides
        </a>
        <a href="/references" className={`top-bar-link${isReferences ? ' is-on' : ''}`}>
          References
        </a>
        <a href="/jobs" className={`top-bar-link${route.page === 'jobs' ? ' is-on' : ''}`}>
          {runningCount > 0 && <span className="jobs-spinner" aria-hidden="true" />}
          Jobs {runningCount > 0 && <span className="top-bar-count">({runningCount})</span>}
        </a>
      </nav>
      <a href="/new" className="top-bar-new">
        <Plus /> New song
      </a>
      <a
        href={SOURCE_URL}
        className="top-bar-source"
        target="_blank"
        rel="noreferrer"
        data-tooltip="the source on GitHub"
        aria-label="the source on GitHub"
      >
        <CodeXml />
      </a>
      <LookSwitcher />
    </header>
  );
}

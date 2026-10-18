// The bar at the top of every page: the logo (home), Songs, Style guides and Jobs (with how
// many are on their way, turning while one runs; the one open marked), a
// button for a new song at the right, a link to the source on GitHub and the switch between light
// and dark; always in the dark look.
import { MarkGithubIcon } from '@primer/octicons-react';
import { Plus } from 'lucide-react';
import { useRef } from 'react';
import type { Job } from '../../shared/job.schema.ts';
import { Logo } from './Logo.tsx';
import { LookSwitcher } from './LookSwitcher.tsx';
import { isJobRunning } from '../queries/jobs.ts';
import { SOURCE_URL } from '../project-links.ts';
import { useHeightProperty } from '../use-height-property.ts';
import type { Route } from '../router.ts';
import '../jobs/jobs.css';
import './TopBar.css';

const LOGO_SIZE = 32;
const GITHUB_MARK_SIZE = 18;

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
          Style guides
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
        <MarkGithubIcon size={GITHUB_MARK_SIZE} />
      </a>
      <LookSwitcher />
    </header>
  );
}

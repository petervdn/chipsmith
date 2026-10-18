// The home page: the logo and what the app is, a button for a new song, the jobs on their way,
// the songs made last and how many there are.
import { Plus } from 'lucide-react';
import type { Job } from '../../shared/job.schema.ts';
import { formatMeter, formatSeconds } from '../format.ts';
import { getLatestSongs, getSongCounts } from './home.ts';
import { JobStrip } from '../jobs/JobStrip.tsx';
import { Logo } from '../top-bar/Logo.tsx';
import { PlayButton } from '../player/PlayButton.tsx';
import { isJobRunning } from '../queries/jobs.ts';
import { useSongs } from '../queries/songs.ts';
import { usePageTitle } from '../use-page-title.ts';
import '../lists/lists.css';
import './HomePage.css';

const LATEST_COUNT = 5;
const LOGO_SIZE = 96;

type HomePageProps = { jobs: Job[] };

/**
 * Shows the home page: the logo and what the app is, a button for a new song, the jobs on their
 * way, how many songs there are and the songs made last.
 *
 * @param props - The component's props.
 * @param props.jobs - Every job, of which those on their way get a line.
 * @returns The page's section element.
 */
export function HomePage({ jobs }: HomePageProps) {
  const { data: listings, error } = useSongs();
  usePageTitle('Home');
  const latest = getLatestSongs(listings ?? [], LATEST_COUNT);
  const { songCount, keeperCount, newCount } = getSongCounts(listings ?? []);

  return (
    <section className="home-page">
      <div className="home-page-hero">
        <Logo size={LOGO_SIZE} />
        <div>
          <h1 className="home-page-name">chipsmith</h1>
          <p className="home-page-line">
            Chiptune songs from prompts, for the NES and Konami's SCC: Claude writes them, Furnace
            plays them, you keep what you like.
          </p>
        </div>
      </div>
      <a className="home-page-new" href="/new">
        <Plus /> New song
      </a>
      {jobs.filter(isJobRunning).map((job) => (
        <JobStrip key={job.id} job={job} />
      ))}
      {error && <p className="error">{error.message}</p>}
      {listings && (
        <p className="home-page-counts">
          <a href="/songs">{songCount} songs</a> · {keeperCount} kept · {newCount} not heard yet
        </p>
      )}
      {latest.length > 0 && (
        <>
          <h2 className="home-page-heading">Made last</h2>
          <ul className="list">
            {latest.map(({ song, seconds, isWaitingForAudio }) => (
              <li key={song.id}>
                <div className="list-row has-play">
                  <PlayButton songId={song.id} isWaitingForAudio={isWaitingForAudio} />
                  <span className="list-main">
                    <a
                      className="list-title list-link"
                      href={`/songs/${encodeURIComponent(song.id)}`}
                    >
                      {song.title}
                    </a>
                    <span className="list-tags">
                      {song.tags.map((tag) => tag.name).join(' · ')}
                    </span>
                  </span>
                  <span className="list-facts">
                    <span>{formatSeconds(seconds)}</span>
                    <span>{Math.round(song.bpm)} bpm</span>
                    <span>{formatMeter(song.beats)}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <a className="home-page-all" href="/songs">
            All songs →
          </a>
        </>
      )}
    </section>
  );
}

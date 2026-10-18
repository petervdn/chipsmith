// The songs on the home page: how many there are (kept, not heard yet) and the ones made last,
// each with ▶.
import { formatMeter, formatSeconds } from '../format.ts';
import { getLatestSongs, getSongCounts } from './home.ts';
import { PlayButton } from '../player/PlayButton.tsx';
import { useSongs } from '../queries/songs.ts';
import '../lists/lists.css';

const LATEST_COUNT = 5;

/**
 * Shows how many songs there are and the songs made last.
 *
 * @returns The songs' section element.
 */
export function HomeLatest() {
  const { data: listings, error } = useSongs();
  const latest = getLatestSongs(listings ?? [], LATEST_COUNT);
  const { songCount, keeperCount, newCount } = getSongCounts(listings ?? []);
  return (
    <section>
      <h2 className="home-page-heading">Your songs</h2>
      {error && <p className="error">{error.message}</p>}
      {listings && (
        <p className="home-page-counts">
          <a href="/songs">{songCount} songs</a> · {keeperCount} kept · {newCount} not heard yet
        </p>
      )}
      {latest.length > 0 && (
        <>
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

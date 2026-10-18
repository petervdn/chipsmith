// The tabs over the songs list: All (`/songs`) and Favorites (`/songs/favorites`), each with how
// many songs it has, the one open marked; the filter's query goes along when switching.
import './SongsTabs.css';

type SongsTabsProps = {
  isFavoritesOnly: boolean;
  allCount: number;
  favoritesCount: number;
  query: string;
};

/**
 * Shows the tabs over the songs list.
 *
 * @param props - The component's props.
 * @param props.isFavoritesOnly - Whether the Favorites tab is open, else All.
 * @param props.allCount - How many songs there are.
 * @param props.favoritesCount - How many of them are favorites.
 * @param props.query - The filter's query, kept on the address when switching.
 * @returns The tabs' nav element.
 */
export function SongsTabs({ isFavoritesOnly, allCount, favoritesCount, query }: SongsTabsProps) {
  return (
    <nav className="songs-tabs" aria-label="which songs">
      <a
        href={`/songs${query}`}
        className={`songs-tabs-tab${isFavoritesOnly ? '' : ' is-on'}`}
        aria-current={isFavoritesOnly ? undefined : 'page'}
      >
        All <span className="songs-tabs-count">{allCount}</span>
      </a>
      <a
        href={`/songs/favorites${query}`}
        className={`songs-tabs-tab${isFavoritesOnly ? ' is-on' : ''}`}
        aria-current={isFavoritesOnly ? 'page' : undefined}
      >
        Favorites <span className="songs-tabs-count">{favoritesCount}</span>
      </a>
    </nav>
  );
}

// A song's title row on its page, kept in view under the top bar so Save and whether there are
// changes always show: the title alone (no Songs › before it), ★ to keep it, and at the right the
// place the editor puts Split, Revert and Save in. Its height is given to the page
// (`--song-title-height`), so what sticks under it knows where it ends.
import { useRef } from 'react';
import type { Song } from '../../shared/song.schema.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { StatusButtons } from '../lists/StatusButtons.tsx';
import { useSetSongStatus } from '../queries/songs.ts';
import { useHeightProperty } from '../use-height-property.ts';
import './SongTitleRow.css';

type SongTitleRowProps = { song: Song; onSaveSlot: (element: HTMLDivElement | null) => void };

/**
 * Shows a song's title row: its title, ★, and the place for the editor's buttons.
 *
 * @param props - The component's props.
 * @param props.song - The song.
 * @param props.onSaveSlot - Called with the element the editor puts its buttons in.
 * @returns The title row's element.
 */
export function SongTitleRow({ song, onSaveSlot }: SongTitleRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { mutate: setStatus } = useSetSongStatus();
  useHeightProperty(rowRef, '--song-title-height');
  return (
    <div ref={rowRef} className="song-title-row">
      <Breadcrumbs crumbs={[{ label: song.title }]} />
      <StatusButtons
        status={song.status}
        onChange={(status) => setStatus({ songId: song.id, status })}
      />
      <div ref={onSaveSlot} className="song-title-row-save" />
    </div>
  );
}

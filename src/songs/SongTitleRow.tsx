// A song's title row on its page, kept in view under the top bar so Save and whether there are
// changes always show: the title alone (no Songs › before it), ★ to keep it, beside them the place
// the editor puts what acts on the song itself in (Split, Export), and at the right the place for
// what acts on its unsaved edits (Revert and Save). Its height is given to the page
// (`--song-title-height`), so what sticks under it knows where it ends.
import { useRef } from 'react';
import type { Song } from '../../shared/song.schema.ts';
import { Breadcrumbs } from '../Breadcrumbs.tsx';
import { StatusButtons } from '../lists/StatusButtons.tsx';
import { useSetSongStatus } from '../queries/songs.ts';
import { useHeightProperty } from '../use-height-property.ts';
import './SongTitleRow.css';

type SongTitleRowProps = {
  song: Song;
  onActionSlot: (element: HTMLDivElement | null) => void;
  onSaveSlot: (element: HTMLDivElement | null) => void;
};

/**
 * Shows a song's title row: its title, ★, and the places for the editor's buttons.
 *
 * @param props - The component's props.
 * @param props.song - The song.
 * @param props.onActionSlot - Called with the element the editor puts the song's actions in.
 * @param props.onSaveSlot - Called with the element the editor puts Revert and Save in.
 * @returns The title row's element.
 */
export function SongTitleRow({ song, onActionSlot, onSaveSlot }: SongTitleRowProps) {
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
      <div ref={onActionSlot} className="song-title-row-actions" />
      <div ref={onSaveSlot} className="song-title-row-save" />
    </div>
  );
}

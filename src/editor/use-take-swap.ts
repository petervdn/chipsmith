/**
 * Putting a take in the selected block (docs/adr/0037): the block plays the take from then on, a
 * draft like any edit; when other blocks of the song play the clip it had, the page asks whether
 * the take goes in them too (docs/adr/0014). With a clip selected instead of a block, the take goes
 * in every block that plays the clip, and the take is selected in its place.
 */
import type { Clip } from '../../shared/clip.schema.ts';
import type { Track } from '../../shared/song.schema.ts';
import { askToConfirm } from '../stores/confirm-store.ts';
import type { BlockPlace, Edited } from './song-edits.ts';
import { getBlock, getClipPlaces, setBlockClip } from './song-edits.ts';
import { getClipTicks } from './timeline.ts';

/** What swapping a take in needs of the editor. */
export type TakeSwapParts = {
  tracks: Track[];
  /** The selected block, or null when none is. */
  place: BlockPlace | null;
  /** The selected clip, or null when none is (or a block is). */
  selectedClipId: string | null;
  /** Selects a clip: the take put in place of the selected one. */
  selectClip: (clipId: string) => void;
  /** The clips the take can be found in: the editor's and the pool's. */
  clips: Clip[];
  bpm: number;
  edit: (change: (current: Track[]) => Edited) => void;
};

/**
 * Gives the handler that puts a take in the selected block, or in every block of the selected clip.
 *
 * @param parts - What swapping needs of the editor.
 * @param parts.tracks - The draft's tracks.
 * @param parts.place - The selected block, or null when none is.
 * @param parts.selectedClipId - The selected clip, or null when none is.
 * @param parts.selectClip - Selects a clip, the take once it is in.
 * @param parts.clips - The clips the take can be found in.
 * @param parts.bpm - The song's tempo, to measure the take in ticks.
 * @param parts.edit - The draft's edit, one undo step.
 * @returns A function called with a take's id that puts it in the block, and in the other blocks
 * that played the same clip if the answer is yes; or, with a clip selected, in all its blocks.
 */
export function useTakeSwap({
  tracks,
  place,
  selectedClipId,
  selectClip,
  clips,
  bpm,
  edit,
}: TakeSwapParts) {
  return async function putTake(clipId: string): Promise<void> {
    // a take made a moment ago may not be among the clips yet; it is as long as its clip
    const ticks = clips.some((clip) => clip.id === clipId)
      ? getClipTicks(clips, clipId, bpm)
      : null;
    if (!place) {
      if (!selectedClipId || selectedClipId === clipId) return;
      const places = getClipPlaces(tracks, selectedClipId);
      edit((current) => ({
        tracks: places.reduce(
          (changed, other) => setBlockClip(changed, other, clipId, ticks).tracks,
          current,
        ),
        place: null,
      }));
      selectClip(clipId);
      return;
    }
    const oldClipId = getBlock(tracks, place)?.clip;
    if (!oldClipId || oldClipId === clipId) return;
    const others = getClipPlaces(tracks, oldClipId).filter(
      (other) => other.trackId !== place.trackId || other.index !== place.index,
    );
    const isEverywhere =
      others.length > 0 &&
      (await askToConfirm({
        question: `${others.length === 1 ? 'Another block plays' : `${others.length} other blocks play`} this clip too. Put the take in ${others.length === 1 ? 'it' : 'them'} as well?`,
        answer: `All ${others.length + 1} blocks`,
        refusal: 'Only this one',
      }));
    edit((current) => {
      const edited = setBlockClip(current, place, clipId, ticks);
      if (!isEverywhere) return edited;
      const swapped = others.reduce(
        (changed, other) => setBlockClip(changed, other, clipId, ticks).tracks,
        edited.tracks,
      );
      return { tracks: swapped, place: edited.place };
    });
  };
}

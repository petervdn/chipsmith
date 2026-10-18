// The prompt builder's parts: rolled at random to start, rolled again except the locked ones, one
// rolled on its own, a
// part picked by hand or a chip switched (which locks it; a rhythm or idea that no longer goes with
// the rest is picked again), and the sentence they make. Kept between visits (stores/new-song-store.ts).
import type { ChipName } from '../../shared/chips.ts';
import { useNewSongStore } from '../stores/new-song-store.ts';
import type { ListPartName, PartName } from './random-prompt.ts';
import { fitParts, getPromptText, getToggledChips, rollPart, rollParts } from './random-prompt.ts';

/**
 * Keeps the prompt builder's parts and locks.
 *
 * @returns The parts, the locked part names, the sentence they make, `roll` (picks the unlocked
 *   parts again), `rollOne` (picks one part again, locked or not), `pick` (sets a part and locks it), `toggleChip` (a chip off, once, twice, off again, never
 *   the last one off, and locks the chips) and `toggleLock`.
 */
export function usePromptBuilder() {
  const parts = useNewSongStore((state) => state.parts);
  const locked = useNewSongStore((state) => state.lockedParts);
  const setParts = useNewSongStore((state) => state.setParts);
  const setLocked = useNewSongStore((state) => state.setLockedParts);
  function lock(name: PartName): void {
    if (!locked.includes(name)) setLocked([...locked, name]);
  }
  return {
    parts,
    locked,
    text: getPromptText(parts),
    roll: () => setParts(rollParts(parts, locked, Math.random)),
    rollOne: (name: PartName) => setParts(rollPart(parts, name, Math.random)),
    pick: (name: ListPartName, value: string) => {
      setParts(fitParts({ ...parts, [name]: value }, Math.random));
      lock(name);
    },
    toggleChip: (chip: ChipName) => {
      setParts(fitParts({ ...parts, chips: getToggledChips(parts.chips, chip) }, Math.random));
      lock('chips');
    },
    toggleLock: (name: PartName) =>
      setLocked(
        locked.includes(name) ? locked.filter((other) => other !== name) : [...locked, name],
      ),
  };
}

// The prompt builder's parts: rolled at random to start, rolled again except the locked ones, a
// part picked by hand or a chip switched (which locks it; a rhythm or idea that no longer goes with
// the rest is picked again), and the sentence they make. Kept while the page is open.
import { useState } from 'react';
import type { ChipName } from '../../shared/chips.ts';
import { CHIP_NAMES } from '../../shared/chips.ts';
import type { ListPartName, PartName, PromptParts } from './random-prompt.ts';
import { fitParts, getPromptText, rollParts } from './random-prompt.ts';

/**
 * Keeps the prompt builder's parts and locks.
 *
 * @returns The parts, the locked part names, the sentence they make, `roll` (picks the unlocked
 *   parts again), `pick` (sets a part and locks it), `toggleChip` (switches a chip on or off, never
 *   the last one off, and locks the chips) and `toggleLock`.
 */
export function usePromptBuilder() {
  const [parts, setParts] = useState<PromptParts>(() => rollParts(null, [], Math.random));
  const [locked, setLocked] = useState<PartName[]>([]);
  function lock(name: PartName): void {
    setLocked((current) => (current.includes(name) ? current : [...current, name]));
  }
  return {
    parts,
    locked,
    text: getPromptText(parts),
    roll: () => setParts((current) => rollParts(current, locked, Math.random)),
    pick: (name: ListPartName, value: string) => {
      setParts((current) => fitParts({ ...current, [name]: value }, Math.random));
      lock(name);
    },
    toggleChip: (chip: ChipName) => {
      setParts((current) => {
        const isOn = current.chips.includes(chip);
        if (isOn && current.chips.length === 1) return current;
        const chips = CHIP_NAMES.filter((name) =>
          name === chip ? !isOn : current.chips.includes(name),
        );
        return fitParts({ ...current, chips }, Math.random);
      });
      lock('chips');
    },
    toggleLock: (name: PartName) =>
      setLocked((current) =>
        current.includes(name) ? current.filter((other) => other !== name) : [...current, name],
      ),
  };
}

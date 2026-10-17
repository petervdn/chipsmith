// The prompt builder's parts: rolled at random to start, rolled again except the locked ones, a
// part picked by hand (which locks it), and the sentence they make. Kept while the page is open.
import { useState } from 'react';
import type { PartName, PromptParts } from './random-prompt.ts';
import { getPromptText, rollParts } from './random-prompt.ts';

/**
 * Keeps the prompt builder's parts and locks.
 *
 * @returns The parts, the locked part names, the sentence they make, `roll` (picks the unlocked
 *   parts again), `pick` (sets a part and locks it) and `toggleLock`.
 */
export function usePromptBuilder() {
  const [parts, setParts] = useState<PromptParts>(() => rollParts(null, [], Math.random));
  const [locked, setLocked] = useState<PartName[]>([]);
  return {
    parts,
    locked,
    text: getPromptText(parts),
    roll: () => setParts((current) => rollParts(current, locked, Math.random)),
    pick: (name: PartName, value: string) => {
      setParts((current) => ({ ...current, [name]: value }));
      setLocked((current) => (current.includes(name) ? current : [...current, name]));
    },
    toggleLock: (name: PartName) =>
      setLocked((current) =>
        current.includes(name) ? current.filter((other) => other !== name) : [...current, name],
      ),
  };
}

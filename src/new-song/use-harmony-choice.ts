// The harmony chosen for a prompt on New: everything Claude's choice at first; its scale, note,
// feel and colour picked by hand (which locks them) or rolled; three presets to hear that fit them,
// picked again when they change or on asking; the part one is being chosen for, if any; a
// progression kept per part. The harmony and its locks are kept between visits
// (stores/new-song-store.ts); the presets offered and the part chosen for, while the page is open.
import { useState } from 'react';
import { useNewSongStore } from '../stores/new-song-store.ts';
import type { ProgressionPreset } from '../../shared/progression-presets.ts';
import type { Section } from '../../shared/structure.schema.ts';
import type { HarmonyChoice, HarmonyPart, HarmonyRowName } from './random-harmony.ts';
import {
  dropProgression,
  getHarmonyParts,
  getSentHarmony,
  keepProgression,
  OPEN_HARMONY,
  pickCandidates,
  rollHarmony,
  rollHarmonyRow,
} from './random-harmony.ts';

/** How many presets are offered to hear at a time. */
const CANDIDATES = 3;

/**
 * Keeps the harmony chosen for a prompt, for the parts of the structure chosen.
 *
 * @param sections - The sections of the structure chosen, or null for none: then one progression
 *   is for the whole song.
 * @returns The harmony (`choice`), its parts, the locked rows, `sent` (the harmony to send, or null),
 *   the presets to hear (`candidates`) and the part one is being chosen for (`choosingPart`, or
 *   undefined); and what changes it: `roll`, `rollRow`, `setRow` (locks the row), `pickOthers`,
 *   `chooseFor` (a part, or null to stop choosing), `keep` (for the part chosen for, which ends the
 *   choosing), `drop`, `toggleLock`, and `clear` (all Claude's choice, unlocked).
 */
export function useHarmonyChoice(sections: Section[] | null) {
  const choice = useNewSongStore((state) => state.harmony);
  const locked = useNewSongStore((state) => state.lockedHarmonyRows);
  const setChoice = useNewSongStore((state) => state.setHarmony);
  const setLocked = useNewSongStore((state) => state.setLockedHarmonyRows);
  const [candidates, setCandidates] = useState<ProgressionPreset[]>(() =>
    pickCandidates(choice, CANDIDATES, [], Math.random),
  );
  const [choosingKey, setChoosingKey] = useState<string | null>(null);
  const parts = getHarmonyParts(sections);
  const choosingPart = parts.find((part) => part.key === choosingKey);
  function change(next: HarmonyChoice): void {
    if (next.mode !== choice.mode || next.feel !== choice.feel) {
      setCandidates(pickCandidates(next, CANDIDATES, [], Math.random));
    }
    setChoice(next);
  }
  return {
    choice,
    parts,
    locked,
    sent: getSentHarmony(choice, parts),
    candidates,
    choosingPart,
    roll: () => change(rollHarmony(choice, locked, Math.random)),
    rollRow: (name: HarmonyRowName) => change(rollHarmonyRow(choice, name, Math.random)),
    setRow: (name: HarmonyRowName, value: string | null) => {
      change({ ...choice, [name]: value });
      if (!locked.includes(name)) setLocked([...locked, name]);
    },
    pickOthers: () =>
      setCandidates(
        pickCandidates(
          choice,
          CANDIDATES,
          candidates.map((preset) => preset.id),
          Math.random,
        ),
      ),
    chooseFor: (part: HarmonyPart | null) => setChoosingKey(part ? part.key : null),
    keep: (preset: ProgressionPreset) => {
      if (!choosingPart) return;
      setChoice(keepProgression(choice, choosingPart, preset));
      setChoosingKey(null);
    },
    drop: (part: HarmonyPart) => setChoice(dropProgression(choice, part)),
    toggleLock: (name: HarmonyRowName) =>
      setLocked(
        locked.includes(name) ? locked.filter((other) => other !== name) : [...locked, name],
      ),
    clear: () => {
      change(OPEN_HARMONY);
      setLocked([]);
    },
  };
}

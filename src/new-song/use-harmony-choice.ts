// The harmony chosen for a prompt on New: everything Claude's choice at first; its scale, note,
// feel and colour picked by hand (which locks them) or rolled; three presets to hear that fit them,
// picked again when they change or on asking, and the part they are heard for; a progression kept
// per part. Kept while the page is open.
import { useState } from 'react';
import type { ProgressionPreset } from '../../shared/progression-presets.ts';
import type { Section } from '../../shared/structure.types.ts';
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
 *   the presets to hear (`candidates`) and the part they are for (`hearingPart`); and what changes
 *   it: `roll`, `rollRow`, `setRow` (locks the row), `pickOthers`, `hearFor`, `keep`, `drop`,
 *   `toggleLock`, and `clear` (all Claude's choice, unlocked).
 */
export function useHarmonyChoice(sections: Section[] | null) {
  const [choice, setChoice] = useState(OPEN_HARMONY);
  const [locked, setLocked] = useState<HarmonyRowName[]>([]);
  const [candidates, setCandidates] = useState<ProgressionPreset[]>(() =>
    pickCandidates(OPEN_HARMONY, CANDIDATES, [], Math.random),
  );
  const [hearingKey, setHearingKey] = useState<string | null>(null);
  const parts = getHarmonyParts(sections);
  const hearingPart = parts.find((part) => part.key === hearingKey) ?? parts[0];
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
    hearingPart,
    roll: () => change(rollHarmony(choice, locked, Math.random)),
    rollRow: (name: HarmonyRowName) => change(rollHarmonyRow(choice, name, Math.random)),
    setRow: (name: HarmonyRowName, value: string | null) => {
      change({ ...choice, [name]: value });
      setLocked((current) => (current.includes(name) ? current : [...current, name]));
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
    hearFor: (part: HarmonyPart) => setHearingKey(part.key),
    keep: (preset: ProgressionPreset) => {
      if (hearingPart) setChoice(keepProgression(choice, hearingPart, preset));
    },
    drop: (part: HarmonyPart) => setChoice(dropProgression(choice, part)),
    toggleLock: (name: HarmonyRowName) =>
      setLocked((current) =>
        current.includes(name) ? current.filter((other) => other !== name) : [...current, name],
      ),
    clear: () => {
      change(OPEN_HARMONY);
      setLocked([]);
    },
  };
}

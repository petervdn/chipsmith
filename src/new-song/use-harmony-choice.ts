// The harmony chosen for a prompt on New: everything Claude's choice at first; its rows and the
// progression of each part of the structure chosen picked by hand (which locks them) or rolled, and
// what of it is sent. Kept while the page is open.
import { useState } from 'react';
import type {
  HarmonySettingName,
  Strictness,
  VariationEnding,
} from '../../shared/harmony-settings.ts';
import type { Progression } from '../../shared/harmony.types.ts';
import type { Section } from '../../shared/structure.types.ts';
import type { HarmonyPart, HarmonyRowName } from './random-harmony.ts';
import {
  getHarmonyParts,
  getPartLock,
  getSentHarmony,
  OPEN_HARMONY,
  rollHarmony,
  rollHarmonyRow,
  rollProgression,
  setProgression,
} from './random-harmony.ts';
import { setHarmonySetting } from '../../shared/harmony-settings.ts';

/**
 * Keeps the harmony chosen for a prompt, for the parts of the structure chosen.
 *
 * @param sections - The sections of the structure chosen, or null for none: then one progression
 *   is for the whole song.
 * @returns The harmony (`choice`), its parts, the locked rows and parts, `sent` (the harmony to send,
 *   or null), and what changes it: `roll` (the unlocked rows and parts), `rollRow`, `rollPart`,
 *   `setNote`, `setMode`, `setSetting`, `setProgression` (each locks what it sets),
 *   `setStrictness`, `setVariation`, `toggleLock`, and `clear` (all Claude's choice, unlocked).
 */
export function useHarmonyChoice(sections: Section[] | null) {
  const [choice, setChoice] = useState(OPEN_HARMONY);
  const [locked, setLocked] = useState<string[]>([]);
  const parts = getHarmonyParts(sections);
  function lock(name: string): void {
    setLocked((current) => (current.includes(name) ? current : [...current, name]));
  }
  return {
    choice,
    parts,
    locked,
    sent: getSentHarmony(choice, parts),
    roll: () => setChoice((current) => rollHarmony(current, parts, locked, Math.random)),
    rollRow: (name: HarmonyRowName) =>
      setChoice((current) => rollHarmonyRow(current, name, Math.random)),
    rollPart: (part: HarmonyPart) =>
      setChoice((current) => rollProgression(current, part, Math.random)),
    setNote: (note: string | null) => {
      setChoice((current) => ({ ...current, note }));
      lock('note');
    },
    setMode: (mode: string | null) => {
      setChoice((current) => ({ ...current, mode }));
      lock('mode');
    },
    setSetting: (name: HarmonySettingName, value: string | null) => {
      setChoice((current) => ({
        ...current,
        settings: setHarmonySetting(current.settings, name, value),
      }));
      lock(name);
    },
    setProgression: (part: HarmonyPart, progression: Progression | null) => {
      setChoice((current) => setProgression(current, part, progression));
      lock(getPartLock(part));
    },
    setStrictness: (strictness: Strictness) => setChoice((current) => ({ ...current, strictness })),
    setVariation: (part: HarmonyPart, ending: VariationEnding) =>
      setChoice((current) => ({
        ...current,
        variations: { ...current.variations, [part.key]: ending },
      })),
    toggleLock: (name: string) =>
      setLocked((current) =>
        current.includes(name) ? current.filter((other) => other !== name) : [...current, name],
      ),
    clear: () => {
      setChoice(OPEN_HARMONY);
      setLocked([]);
    },
  };
}

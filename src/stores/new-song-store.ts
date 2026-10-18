/**
 * New's choices while the page is open, shared by its hooks and started afresh when the page is left
 * (docs/adr/0052): the prompt builder's parts and locks, the harmony chosen and its locks, and the
 * structure chosen, as edited. Nothing is saved. What is
 * only the view's (the section selected, the presets offered to hear, the part a progression is
 * being chosen for) is not kept. The rules of choosing are the New page's hooks' (new-song/); this
 * only keeps the values.
 */
import { create } from 'zustand';
import type { Section } from '../../shared/structure.schema.ts';
import type { HarmonyChoice, HarmonyRowName } from '../new-song/random-harmony.ts';
import { OPEN_HARMONY } from '../new-song/random-harmony.ts';
import type { PartName, PromptParts } from '../new-song/random-prompt.ts';
import { rollParts } from '../new-song/random-prompt.ts';

/** Where the structure being edited came from: none, a preset, a saved structure, or a new one. */
export type StructureSource =
  | { kind: 'none' }
  | { kind: 'own' }
  | { kind: 'preset'; id: string }
  | { kind: 'saved'; id: string };

/** The structure chosen, as edited. */
export type StructureDraft = {
  source: StructureSource;
  name: string;
  sections: Section[];
  /** Whether the sections were edited since they were chosen or saved. */
  isEdited: boolean;
};

/** What New's choices are kept as. */
type NewSongChoices = {
  parts: PromptParts;
  lockedParts: PartName[];
  harmony: HarmonyChoice;
  lockedHarmonyRows: HarmonyRowName[];
  structure: StructureDraft;
};

/** New's choices and how to change them. */
type NewSongStore = NewSongChoices & {
  setParts: (parts: PromptParts) => void;
  setLockedParts: (lockedParts: PartName[]) => void;
  setHarmony: (harmony: HarmonyChoice) => void;
  setLockedHarmonyRows: (lockedHarmonyRows: HarmonyRowName[]) => void;
  setStructure: (structure: StructureDraft) => void;
  /** Starts New afresh: parts rolled again, nothing locked, everything Claude's choice. */
  reset: () => void;
};

/** No structure chosen. */
const NO_STRUCTURE: StructureDraft = {
  source: { kind: 'none' },
  name: '',
  sections: [],
  isEdited: false,
};

/**
 * Returns New's choices as a first visit has them.
 *
 * @returns Parts rolled at random, nothing locked, the harmony open and no structure.
 */
function getFreshChoices(): NewSongChoices {
  return {
    parts: rollParts(null, [], Math.random),
    lockedParts: [],
    harmony: OPEN_HARMONY,
    lockedHarmonyRows: [],
    structure: NO_STRUCTURE,
  };
}

/** The New page's choices store. */
export const useNewSongStore = create<NewSongStore>()((set) => ({
  ...getFreshChoices(),
  setParts: (parts) => set({ parts }),
  setLockedParts: (lockedParts) => set({ lockedParts }),
  setHarmony: (harmony) => set({ harmony }),
  setLockedHarmonyRows: (lockedHarmonyRows) => set({ lockedHarmonyRows }),
  setStructure: (structure) => set({ structure }),
  reset: () => set(getFreshChoices()),
}));

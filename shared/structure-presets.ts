/**
 * The structures every prompt can start from, written short (structure-notation.ts): common forms of
 * songs and game music. Knows nothing of files or the page.
 */
import { readNotation } from './structure-notation.ts';
import type { Section } from './structure.schema.ts';

/** A preset: its id, its name and its sections. */
export type StructurePreset = { id: string; name: string; sections: Section[] };

/** The presets, written short. */
const PRESET_NOTATIONS: { id: string; name: string; notation: string }[] = [
  { id: 'loop', name: 'Loop', notation: 'A8 A8' },
  { id: 'aaba', name: 'AABA (32 bars)', notation: "A8 A'8 B8 A8" },
  {
    id: 'verse-chorus',
    name: 'Verse and chorus',
    notation: "A8(verse) B8(chorus) A'8(verse) B8(chorus) C8(bridge) B'8(chorus)",
  },
  { id: 'rondo', name: 'Rondo', notation: "A8 B8 A8 C8 A'8" },
  { id: 'breakdown', name: 'Loop with a breakdown', notation: "A8 A'8 B4(breakdown) A8" },
  {
    id: 'build',
    name: 'Build to a climax',
    notation: "A8(intro) B8 B'8(build) C16(climax)",
  },
  { id: 'through', name: 'Through-composed', notation: 'A8 B8 C8 D8' },
];

/** Every preset, in the order they are offered. */
export const STRUCTURE_PRESETS: StructurePreset[] = PRESET_NOTATIONS.map(
  ({ id, name, notation }) => {
    const { sections, error } = readNotation(notation);
    if (!sections) throw new Error(`the preset ${id} does not read: ${error}`);
    return { id, name, sections };
  },
);

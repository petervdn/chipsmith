/**
 * Where the structure a song was asked for lies on its timeline: each section's first bar and its
 * bars, from the song's start, as it was sent with the prompt. It never follows the blocks: edits
 * leave it where it is. Given sections, gives numbers and words; knows nothing of the page.
 */
import { getRelation, getSectionName } from '../../shared/structure-notation.ts';
import type { Section, SectionRelation } from '../../shared/structure.schema.ts';

/** A section as the structure's lane draws it. */
export type StructureSpan = {
  /** Its name: its letter and a mark per variation (A, A′). */
  name: string;
  /** Its letter's place in the alphabet, from 0, which picks its colour. */
  letterIndex: number;
  relation: SectionRelation;
  role: string | null;
  /** Its first bar, from 0. */
  startBar: number;
  bars: number;
  /** What it was asked to be, in a line: its bars, its role, energy and note. */
  description: string;
};

/** The letter the parts start from. */
const FIRST_LETTER = 'A'.charCodeAt(0);

/**
 * Returns the sections of a structure as its lane draws them, one after another from the first bar.
 *
 * @param sections - The structure's sections, in order.
 * @returns A span per section.
 */
export function getStructureSpans(sections: Section[]): StructureSpan[] {
  let startBar = 0;
  return sections.map((section, i) => {
    const name = getSectionName(section);
    const details = [
      `bars ${startBar + 1}–${startBar + section.bars}`,
      section.role,
      section.energy === null ? null : `energy ${section.energy} of 5`,
      section.note.trim() || null,
    ].filter(Boolean);
    const span = {
      name,
      letterIndex: section.letter.charCodeAt(0) - FIRST_LETTER,
      relation: getRelation(sections, i),
      role: section.role,
      startBar,
      bars: section.bars,
      description: `${name}: ${details.join(', ')}`,
    };
    startBar += section.bars;
    return span;
  });
}

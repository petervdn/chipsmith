/**
 * A structure written short: `A8 A'8 B8 A8 C16(climax)`. A letter is a part; a ' after it a variation
 * (two for the second variation); a number its bars (8 when left out); a word in brackets its role.
 * Read into sections and written back; how a section stands to those before it follows from the
 * letters. Knows nothing of files or the page.
 */
import type { Section, SectionRelation } from './structure.types.ts';

/** The bars a section has when the notation leaves them out. */
export const DEFAULT_BARS = 8;
/** The most bars a section can have. */
const MOST_BARS = 256;
/** A section written short: its letter, its variation marks, its bars, its role. */
const TOKEN = /^([A-Z])(['′″]*)(\d*)(?:\(([^)]*)\))?$/;

/** The sections a notation reads as, or what is wrong with it. */
export type ReadNotation = { sections: Section[]; error: null } | { sections: null; error: string };

/**
 * Reads a structure written short.
 *
 * @param text - The notation, sections separated by spaces or commas; letters may be lower case.
 * @returns The sections (energy null, no note), or the first section that does not read.
 */
export function readNotation(text: string): ReadNotation {
  const tokens = text
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0) return { sections: null, error: 'no sections' };
  const sections: Section[] = [];
  for (const token of tokens) {
    const match = TOKEN.exec(token.replace(/^[a-z]/, (letter) => letter.toUpperCase()));
    if (!match) {
      return { sections: null, error: `"${token}" is not a section (like A8, A'8, C16(climax))` };
    }
    const [, letter = 'A', marks = '', bars = '', role = ''] = match;
    const count = bars === '' ? DEFAULT_BARS : Number(bars);
    if (count < 1 || count > MOST_BARS) {
      return { sections: null, error: `"${token}": bars are 1 to ${MOST_BARS}` };
    }
    const variant = [...marks].reduce((sum, mark) => sum + (mark === '″' ? 2 : 1), 0);
    sections.push({
      letter,
      variant,
      bars: count,
      role: role.trim() || null,
      energy: null,
      note: '',
      leadIn: [],
    });
  }
  return { sections, error: null };
}

/**
 * Writes a structure short.
 *
 * @param sections - The sections.
 * @returns The notation, like `A8 A'8 B8 C16(climax)`.
 */
export function writeNotation(sections: Section[]): string {
  return sections
    .map(
      ({ letter, variant, bars, role }) =>
        `${letter}${"'".repeat(variant)}${bars}${role ? `(${role})` : ''}`,
    )
    .join(' ');
}

/**
 * Tells how a section stands to the sections before it.
 *
 * @param sections - The structure's sections.
 * @param index - The section's place among them.
 * @returns `new` for a part first heard, `variation` for a variant first heard or a section heard
 *   before in other bars, `repeat` for a letter and variant heard before in as many bars.
 */
export function getRelation(sections: Section[], index: number): SectionRelation {
  const section = sections[index];
  if (!section) return 'new';
  const heard = sections
    .slice(0, index)
    .filter((earlier) => earlier.letter === section.letter && earlier.variant === section.variant);
  if (heard.some((earlier) => earlier.bars === section.bars)) return 'repeat';
  return section.variant === 0 && heard.length === 0 ? 'new' : 'variation';
}

/**
 * Returns a section's name: its letter and a mark per variation.
 *
 * @param section - The section.
 * @param section.letter - Its letter.
 * @param section.variant - Its variant.
 * @returns The name, like A, A′ or A″.
 */
export function getSectionName({ letter, variant }: { letter: string; variant: number }): string {
  return letter + '′'.repeat(variant);
}

/**
 * Takes the energy, notes and lead-ins of the sections before a new reading, where a section is in the same
 * place with the same letter and variant.
 *
 * @param read - The sections just read from the notation.
 * @param before - The sections before.
 * @returns The sections read, with the energy, note and lead-in kept where they still apply.
 */
export function keepDetails(read: Section[], before: Section[]): Section[] {
  return read.map((section, i) => {
    const old = before[i];
    if (!old || old.letter !== section.letter || old.variant !== section.variant) return section;
    return {
      ...section,
      energy: old.energy,
      note: old.note,
      role: section.role ?? old.role,
      leadIn: old.leadIn,
    };
  });
}

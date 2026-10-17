/**
 * A structure as the part of a prompt that asks for it: a line per section, saying where it falls in
 * bars, whether it is a new part, a variation of one or one again, and its role, energy and note.
 * Knows nothing of files or the page.
 */
import { getRelation, getSectionName, writeNotation } from './structure-notation.ts';
import type { SectionRelation, SentStructure } from './structure.types.ts';

/** What a relation asks of the composer. */
const RELATION_ASKS = {
  new: 'a new part',
  variation: 'a variation of {letter}: the same material, changed',
  repeat: '{name} again, as it was',
} satisfies Record<SectionRelation, string>;

/**
 * Returns the lines of a prompt that ask for a structure.
 *
 * @param structure - The structure sent with the prompt.
 * @param structure.name - Its name.
 * @param structure.sections - Its sections, in order.
 * @returns The lines, starting with an empty one; none for a structure without sections.
 */
export function getStructureLines({ name, sections }: SentStructure): string[] {
  if (sections.length === 0) return [];
  const bars = sections.reduce((sum, section) => sum + section.bars, 0);
  let start = 1;
  const lines = sections.map((section, i) => {
    const sectionName = getSectionName(section);
    const ask = RELATION_ASKS[getRelation(sections, i)]
      .replace('{letter}', section.letter)
      .replace('{name}', sectionName);
    const details = [
      section.role,
      section.energy === null ? null : `energy ${section.energy} of 5`,
      section.note.trim() || null,
    ].filter(Boolean);
    const line = `${i + 1}. ${sectionName}, bars ${start}–${start + section.bars - 1} (${section.bars} bars): ${ask}${details.length > 0 ? `; ${details.join('; ')}` : ''}.`;
    start += section.bars;
    return line;
  });
  return [
    '',
    `Structure "${name}" (${writeNotation(sections)}, ${bars} bars in all), to follow for every song; a letter is a part, a ′ a variation of it:`,
    ...lines,
  ];
}

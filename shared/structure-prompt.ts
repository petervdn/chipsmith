/**
 * A structure as the part of a prompt that asks for it: a line per section, saying where it falls in
 * bars, whether it is a new part, a variation of one or one again, its role, energy and note, and
 * how the section before leads into it.
 * Knows nothing of files or the page.
 */
import { getRelation, getSectionName, writeNotation } from './structure-notation.ts';
import { getLeadIn } from './lead-ins.ts';
import type { SectionRelation, SentStructure } from './structure.types.ts';

/** What a relation asks of the composer. */
const RELATION_ASKS = {
  new: 'a new part',
  variation: 'a variation of {letter}: the same material, changed',
  repeat: '{name} again, as it was',
} satisfies Record<SectionRelation, string>;

/**
 * Says how a section is led into, as a prompt asks for it.
 *
 * @param leadIn - The lead-ins' values.
 * @returns The words, or null for none.
 */
function getLeadInText(leadIn: string[]): string | null {
  const asks = leadIn.flatMap((value) => getLeadIn(value)?.ask ?? []);
  if (asks.length === 0) return null;
  return `led into from the section before, at its end, with ${asks.join(', ')}`;
}

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
      i > 0 ? getLeadInText(section.leadIn) : null,
    ].filter(Boolean);
    const line = `${i + 1}. ${sectionName}, bars ${start}–${start + section.bars - 1} (${section.bars} bars): ${ask}${details.length > 0 ? `; ${details.join('; ')}` : ''}.`;
    start += section.bars;
    return line;
  });
  return [
    '',
    `Structure "${name}" (${writeNotation(sections)}, ${bars} bars in all), to follow for every song; where the prompt itself says otherwise, the prompt wins; a letter is a part, a ′ a variation of it:`,
    ...lines,
  ];
}

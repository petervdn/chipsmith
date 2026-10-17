/**
 * The edits of a structure in the Structure panel: a section added as a new part, copied after
 * itself, moved, removed, or changed (its part, variant, bars, role, energy, note, lead-in); a
 * lead-in picked at random. Each takes the
 * sections and gives new ones. Knows nothing of the page.
 */
import { DEFAULT_BARS } from '../../shared/structure-notation.ts';
import { LEAD_INS } from '../../shared/lead-ins.ts';
import type { Section } from '../../shared/structure.types.ts';

/** The roles offered for a section, besides none. */
export const SECTION_ROLES = [
  'intro',
  'verse',
  'chorus',
  'bridge',
  'build',
  'drop',
  'breakdown',
  'solo',
  'climax',
  'outro',
];

/** How often a lead-in picked at random has two parts instead of one. */
const TWO_LEAD_INS_CHANCE = 0.5;

/** The letters a part can have. */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Returns the first letter not used yet: the letter a new part gets.
 *
 * @param sections - The sections.
 * @returns The letter; Z when all are used.
 */
export function getNextLetter(sections: Section[]): string {
  return (
    [...LETTERS].find((letter) => !sections.some((section) => section.letter === letter)) ?? 'Z'
  );
}

/**
 * Adds a new part at the end, with the next free letter.
 *
 * @param sections - The sections.
 * @returns The sections with the new part last.
 */
export function addSection(sections: Section[]): Section[] {
  const letter = getNextLetter(sections);
  return [
    ...sections,
    { letter, variant: 0, bars: DEFAULT_BARS, role: null, energy: null, note: '', leadIn: [] },
  ];
}

/**
 * Places a copy of a section right after it: the same part again.
 *
 * @param sections - The sections.
 * @param index - The section to copy.
 * @returns The sections with the copy after it.
 */
export function duplicateSection(sections: Section[], index: number): Section[] {
  const section = sections[index];
  if (!section) return sections;
  return [...sections.slice(0, index + 1), { ...section }, ...sections.slice(index + 1)];
}

/**
 * Moves a section one place earlier or later.
 *
 * @param sections - The sections.
 * @param index - The section to move.
 * @param step - -1 for earlier, 1 for later.
 * @returns The sections with it moved; as they were at either end.
 */
export function moveSection(sections: Section[], index: number, step: number): Section[] {
  const target = index + step;
  const section = sections[index];
  const other = sections[target];
  if (!section || !other) return sections;
  return sections.map((current, i) => (i === index ? other : i === target ? section : current));
}

/**
 * Removes a section.
 *
 * @param sections - The sections.
 * @param index - The section to remove.
 * @returns The sections without it.
 */
export function removeSection(sections: Section[], index: number): Section[] {
  return sections.filter((_unused, i) => i !== index);
}

/**
 * Changes a section.
 *
 * @param sections - The sections.
 * @param index - The section to change.
 * @param change - Its fields to change.
 * @returns The sections with it changed.
 */
export function changeSection(
  sections: Section[],
  index: number,
  change: Partial<Section>,
): Section[] {
  return sections.map((section, i) => (i === index ? { ...section, ...change } : section));
}

/**
 * Returns the parts a section can be: every part and variant in the structure, and a new part.
 *
 * @param sections - The sections.
 * @returns Each choice's letter and variant, the new part (the next free letter) last.
 */
export function getPartChoices(sections: Section[]): { letter: string; variant: number }[] {
  const choices: { letter: string; variant: number }[] = [];
  for (const { letter, variant } of sections) {
    for (let each = 0; each <= variant + 1; each++) {
      if (!choices.some((choice) => choice.letter === letter && choice.variant === each)) {
        choices.push({ letter, variant: each });
      }
    }
  }
  choices.sort(
    (first, second) => first.letter.localeCompare(second.letter) || first.variant - second.variant,
  );
  return [...choices, { letter: getNextLetter(sections), variant: 0 }];
}

/**
 * Switches a lead-in of a section on or off.
 *
 * @param leadIn - The section's lead-ins.
 * @param value - The lead-in switched.
 * @returns The lead-ins, with it added or taken out, in the order they are offered.
 */
export function toggleLeadIn(leadIn: string[], value: string): string[] {
  const isOn = leadIn.includes(value);
  return LEAD_INS.map((candidate) => candidate.value).filter((candidate) =>
    candidate === value ? !isOn : leadIn.includes(candidate),
  );
}

/**
 * Picks a lead-in at random: one part, or now and then two, played by different voices.
 *
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The lead-ins' values, in the order they are offered.
 */
export function rollLeadIn(getRandom: () => number): string[] {
  const count = getRandom() < TWO_LEAD_INS_CHANCE ? 2 : 1;
  const picked: string[] = [];
  while (picked.length < count) {
    const free = LEAD_INS.filter(
      ({ group }) =>
        !picked.some((value) => LEAD_INS.find((leadIn) => leadIn.value === value)?.group === group),
    );
    const leadIn = free[Math.floor(getRandom() * free.length)];
    if (!leadIn) break;
    picked.push(leadIn.value);
  }
  return LEAD_INS.map((leadIn) => leadIn.value).filter((value) => picked.includes(value));
}

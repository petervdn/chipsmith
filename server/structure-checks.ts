/**
 * Checks of a song's structure where it comes in, from a structure.json, a job.json, a song.json or a
 * request: its sections field by field. Knows nothing of files or HTTP.
 */
import type {
  Section,
  SentStructure,
  Structure,
  StructureDraft,
} from '../shared/structure.schema.ts';
import { getLeadIn } from '../shared/lead-ins.ts';
import { getArray, getNumber, getObject, getString, getStringOrNull } from './json-checks.ts';

/** The letters a section can have. */
const LETTERS = /^[A-Z]$/;
/** The most bars a section can have, and the highest variant and energy. */
const MOST_BARS = 256;
const MOST_VARIANT = 9;
const MOST_ENERGY = 5;

/**
 * Checks a structure.json's content.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The structure.
 */
export function checkStructure(value: unknown, path: string): Structure {
  const structure = getObject(value, path);
  return {
    id: getString(structure['id'], `${path}.id`),
    ...checkStructureDraft(structure, path),
    created: getString(structure['created'], `${path}.created`),
    updated: getString(structure['updated'], `${path}.updated`),
  };
}

/**
 * Checks a structure's name and sections, as a request sends them. The name, trimmed, must not be
 * empty, and there must be a section.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @returns The structure's name and sections.
 */
export function checkStructureDraft(value: unknown, path: string): StructureDraft {
  const draft = getObject(value, path);
  const name = getString(draft['name'], `${path}.name`).trim();
  if (!name) throw new Error(`${path}.name is empty`);
  return { name, sections: checkSections(draft['sections'], `${path}.sections`) };
}

/**
 * Checks a structure as it was sent with a prompt, or none.
 *
 * @param value - The value parsed from JSON; null or missing is no structure.
 * @param path - Where the value is, named in an error.
 * @returns The structure sent, or null.
 */
export function checkSentStructure(value: unknown, path: string): SentStructure | null {
  if (value === null || value === undefined) return null;
  const structure = getObject(value, path);
  return {
    name: getString(structure['name'], `${path}.name`),
    sections: checkSections(structure['sections'], `${path}.sections`),
  };
}

/**
 * Checks a list of sections: a letter A to Z, a variant 0 to 9, bars 1 to 256, a role or null, an
 * energy 1 to 5 or null, a note, and its lead-ins (none when left out).
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @returns The sections; there is at least one.
 */
function checkSections(value: unknown, path: string): Section[] {
  const sections = getArray(value, path, (item, itemPath): Section => {
    const section = getObject(item, itemPath);
    const letter = getString(section['letter'], `${itemPath}.letter`);
    if (!LETTERS.test(letter)) throw new Error(`${itemPath}.letter is not A to Z`);
    const energy = section['energy'] ?? null;
    return {
      letter,
      variant: getWhole(section['variant'], `${itemPath}.variant`, 0, MOST_VARIANT),
      bars: getWhole(section['bars'], `${itemPath}.bars`, 1, MOST_BARS),
      role: getStringOrNull(section['role'] ?? null, `${itemPath}.role`),
      energy: energy === null ? null : getWhole(energy, `${itemPath}.energy`, 1, MOST_ENERGY),
      note: getString(section['note'] ?? '', `${itemPath}.note`),
      leadIn: getArray(section['leadIn'] ?? [], `${itemPath}.leadIn`, checkLeadIn),
    };
  });
  if (sections.length === 0) throw new Error(`${path} has no sections`);
  return sections;
}

/**
 * Checks a lead-in: one of those there are.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @returns The lead-in's value.
 */
function checkLeadIn(value: unknown, path: string): string {
  const leadIn = getString(value, path);
  if (!getLeadIn(leadIn)) throw new Error(`${path} is not a lead-in`);
  return leadIn;
}

/**
 * Checks a whole number within bounds.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @param least - The lowest it may be.
 * @param most - The highest it may be.
 * @returns The number.
 */
function getWhole(value: unknown, path: string, least: number, most: number): number {
  const number = getNumber(value, path);
  if (!Number.isInteger(number) || number < least || number > most) {
    throw new Error(`${path} is not a whole number from ${least} to ${most}`);
  }
  return number;
}

/**
 * Checks of a song's harmony where it comes in, from a job.json, a song.json or a request: its
 * scale, feel and colour each one there is, and each progression kept chord by chord. Knows nothing
 * of files or HTTP.
 */
import { normalizeNumeral } from '../shared/chord-numerals.ts';
import type { HarmonyWord } from '../shared/harmony-words.ts';
import { COLOURS, FEELS } from '../shared/harmony-words.ts';
import type { Chord, PartProgression, Progression, SentHarmony } from '../shared/harmony.schema.ts';
import { MODES, NOTES } from '../shared/modes.ts';
import { isChordLength } from '../shared/progression-notation.ts';
import { getArray, getObject, getString, getStringOrNull } from './json-checks.ts';

/** The letters a part can have. */
const LETTERS = /^[A-Z]$/;
/** The mode names there are. */
const MODE_NAMES = MODES.map(({ name }) => name);

/**
 * Checks a harmony as it was sent with a prompt, or none.
 *
 * @param value - The value parsed from JSON; null or missing is no harmony.
 * @param path - Where the value is, named in an error.
 * @returns The harmony sent, or null.
 */
export function checkSentHarmony(value: unknown, path: string): SentHarmony | null {
  if (value === null || value === undefined) return null;
  const harmony = getObject(value, path);
  return {
    note: checkOneOf(harmony['note'], NOTES, `${path}.note`),
    mode: checkOneOf(harmony['mode'], MODE_NAMES, `${path}.mode`),
    feel: checkOneOf(harmony['feel'], getValues(FEELS), `${path}.feel`),
    colour: checkOneOf(harmony['colour'], getValues(COLOURS), `${path}.colour`),
    parts: getArray(harmony['parts'] ?? [], `${path}.parts`, checkPart),
  };
}

/**
 * Checks a value that is one of a list, or null.
 *
 * @param value - The value parsed from JSON; missing is null.
 * @param values - What it may be.
 * @param path - Where the value is, named in an error.
 * @returns The value, or null.
 */
function checkOneOf(value: unknown, values: string[], path: string): string | null {
  const checked = getStringOrNull(value ?? null, path);
  if (checked !== null && !values.includes(checked)) {
    throw new Error(`${path} is not one of ${values.join(', ')}`);
  }
  return checked;
}

/**
 * Returns the values of feels or colours.
 *
 * @param words - The feels or colours.
 * @returns Their values.
 */
function getValues(words: HarmonyWord[]): string[] {
  return words.map(({ value }) => value);
}

/**
 * Checks a part's progression: its letter or null, and the progression.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @returns The part's progression.
 */
function checkPart(value: unknown, path: string): PartProgression {
  const part = getObject(value, path);
  const letter = getStringOrNull(part['letter'] ?? null, `${path}.letter`);
  if (letter !== null && !LETTERS.test(letter)) throw new Error(`${path}.letter is not A to Z`);
  return { letter, progression: checkProgression(part['progression'], `${path}.progression`) };
}

/**
 * Checks a progression: its name, its mode, and its chords, at least one, each a numeral and a
 * length.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @returns The progression, its numerals written the one way.
 */
function checkProgression(value: unknown, path: string): Progression {
  const progression = getObject(value, path);
  const chords = getArray(progression['chords'], `${path}.chords`, (item, itemPath): Chord => {
    const chord = getObject(item, itemPath);
    const numeral = normalizeNumeral(getString(chord['numeral'], `${itemPath}.numeral`));
    if (!numeral) throw new Error(`${itemPath}.numeral is not a chord`);
    const bars = chord['bars'];
    if (typeof bars !== 'number' || !isChordLength(bars)) {
      throw new Error(`${itemPath}.bars is not a length a chord can have`);
    }
    return { numeral, bars };
  });
  if (chords.length === 0) throw new Error(`${path}.chords has no chords`);
  const mode = checkOneOf(progression['mode'], MODE_NAMES, `${path}.mode`);
  if (mode === null) throw new Error(`${path}.mode is missing`);
  return { name: getString(progression['name'], `${path}.name`), mode, chords };
}

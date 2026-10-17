/**
 * Checks of a song's harmony where it comes in, from a job.json, a song.json or a request: its key,
 * each setting one of its options, and each part's progression chord by chord. Knows nothing of
 * files or HTTP.
 */
import { normalizeNumeral } from '../shared/chord-numerals.ts';
import type { HarmonyOption } from '../shared/harmony-settings.ts';
import {
  HARMONY_SETTING_NAMES,
  HARMONY_SETTINGS,
  STRICTNESSES,
  VARIATION_ENDINGS,
  setHarmonySetting,
} from '../shared/harmony-settings.ts';
import type {
  Chord,
  HarmonySettings,
  PartHarmony,
  Progression,
  SentHarmony,
} from '../shared/harmony.types.ts';
import { MODES, NOTES } from '../shared/modes.ts';
import { isChordLength } from '../shared/progression-notation.ts';
import { getArray, getObject, getString, getStringOrNull } from './json-checks.ts';

/** The letters a part can have. */
const LETTERS = /^[A-Z]$/;

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
  const note = getStringOrNull(harmony['note'] ?? null, `${path}.note`);
  if (note !== null && !NOTES.includes(note)) throw new Error(`${path}.note is not a note`);
  const mode = getStringOrNull(harmony['mode'] ?? null, `${path}.mode`);
  if (mode !== null && !MODES.some(({ name }) => name === mode)) {
    throw new Error(`${path}.mode is not a mode`);
  }
  const strictness = getString(harmony['strictness'], `${path}.strictness`);
  const strictOption = STRICTNESSES.find((option) => option.value === strictness);
  if (!strictOption) throw new Error(`${path}.strictness is not one of its options`);
  return {
    note,
    mode,
    settings: checkSettings(harmony['settings'], `${path}.settings`),
    strictness: strictOption.value,
    parts: getArray(harmony['parts'], `${path}.parts`, checkPart),
  };
}

/**
 * Checks a harmony's settings: each one of its options, or null.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @returns The settings.
 */
function checkSettings(value: unknown, path: string): HarmonySettings {
  const settings = getObject(value, path);
  let checked: HarmonySettings = {
    chords: null,
    colour: null,
    rhythm: null,
    bass: null,
    cadence: null,
    keyChange: null,
  };
  for (const name of HARMONY_SETTING_NAMES) {
    const setting = getStringOrNull(settings[name] ?? null, `${path}.${name}`);
    if (setting === null) continue;
    const options: readonly HarmonyOption[] = HARMONY_SETTINGS[name].options;
    if (!options.some((option) => option.value === setting)) {
      throw new Error(`${path}.${name} is not one of its options`);
    }
    checked = setHarmonySetting(checked, name, setting);
  }
  return checked;
}

/**
 * Checks a part's harmony: its letter or null, its progression or null, how its variations end.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in an error.
 * @returns The part's harmony.
 */
function checkPart(value: unknown, path: string): PartHarmony {
  const part = getObject(value, path);
  const letter = getStringOrNull(part['letter'] ?? null, `${path}.letter`);
  if (letter !== null && !LETTERS.test(letter)) throw new Error(`${path}.letter is not A to Z`);
  const variation = getString(part['variation'] ?? 'same', `${path}.variation`);
  const ending = VARIATION_ENDINGS.find((option) => option.value === variation);
  if (!ending) throw new Error(`${path}.variation is not one of its options`);
  const progression = part['progression'] ?? null;
  return {
    letter,
    progression: progression === null ? null : checkProgression(progression, `${path}.progression`),
    variation: ending.value,
  };
}

/**
 * Checks a progression: its name and its chords, at least one, each a numeral and a length.
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
  return { name: getString(progression['name'], `${path}.name`), chords };
}

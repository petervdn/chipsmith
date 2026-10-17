/**
 * A harmony in words: the lines of a prompt that ask for it (its key, its settings, a progression
 * per part with the chords named in the key), and the short line the page shows it as. Knows
 * nothing of files or the page.
 */
import { getChordName } from './chord-numerals.ts';
import type { HarmonyOption } from './harmony-settings.ts';
import {
  HARMONY_SETTING_NAMES,
  HARMONY_SETTINGS,
  STRICTNESSES,
  VARIATION_ENDINGS,
  getHarmonyOption,
} from './harmony-settings.ts';
import type { Chord, PartHarmony, SentHarmony } from './harmony.types.ts';
import { getProgressionBars, writeBars, writeProgression } from './progression-notation.ts';

/**
 * Returns the lines of a prompt that ask for a harmony.
 *
 * @param harmony - The harmony sent with the prompt.
 * @returns The lines, starting with an empty one; none for a harmony that asks for nothing.
 */
export function getHarmonyLines(harmony: SentHarmony): string[] {
  const settings = getSettingAsks(harmony);
  const parts = harmony.parts.flatMap((part) => getPartLines(part, harmony.note));
  const key = getKeyLine(harmony);
  if (!key && settings.length === 0 && parts.length === 0) return [];
  const strictness = getHarmonyOption(STRICTNESSES, harmony.strictness)?.ask ?? '';
  return [
    '',
    `Harmony, for every song (${strictness}); where the prompt itself names a key or chords, the prompt wins:`,
    ...(key ? [`- ${key}`] : []),
    ...(settings.length > 0 ? [`- Chords: ${settings.join('; ')}.`] : []),
    ...(parts.length > 0
      ? [
          '- Progressions, as Roman numerals on the major scale of the key (♭VI is the major chord on the minor sixth), each repeated to fill its part:',
          ...parts,
        ]
      : []),
  ];
}

/**
 * Returns a harmony as one short line: its key, its settings and its progressions.
 *
 * @param harmony - The harmony.
 * @returns The line, like `A minor · 7ths · A: i ♭VI ♭III ♭VII`; empty when it asks for nothing.
 */
export function getHarmonySummary(harmony: SentHarmony): string {
  const key = [harmony.note, harmony.mode].filter(Boolean).join(' ');
  const settings = HARMONY_SETTING_NAMES.flatMap((name) => {
    const value = harmony.settings[name];
    const options: readonly HarmonyOption[] = HARMONY_SETTINGS[name].options;
    return value ? (getHarmonyOption(options, value)?.label ?? []) : [];
  });
  const parts = harmony.parts.flatMap(({ letter, progression }) =>
    progression ? `${letter ? `${letter}: ` : ''}${writeProgression(progression.chords)}` : [],
  );
  return [key, ...settings, ...parts].filter(Boolean).join(' · ');
}

/**
 * Returns the line that asks for a harmony's key.
 *
 * @param harmony - The harmony.
 * @param harmony.note - The key's note, or null.
 * @param harmony.mode - The key's mode, or null.
 * @returns The line, or null when both are Claude's choice.
 */
function getKeyLine({ note, mode }: SentHarmony): string | null {
  if (note && mode) return `Key: ${note} ${mode}.`;
  if (note) return `Key: on ${note}, the mode your choice.`;
  if (mode) return `Mode: ${mode}, the key's note your choice.`;
  return null;
}

/**
 * Returns what a harmony's settings ask for.
 *
 * @param harmony - The harmony.
 * @returns A phrase per setting that is not Claude's choice.
 */
function getSettingAsks(harmony: SentHarmony): string[] {
  return HARMONY_SETTING_NAMES.flatMap((name) => {
    const value = harmony.settings[name];
    const options: readonly HarmonyOption[] = HARMONY_SETTINGS[name].options;
    return value ? (getHarmonyOption(options, value)?.ask ?? []) : [];
  });
}

/**
 * Returns the lines that ask for a part's progression and how its variations end.
 *
 * @param part - The part's harmony.
 * @param part.letter - Its letter, or null for the whole song.
 * @param part.progression - Its progression, or null.
 * @param part.variation - How its variations end.
 * @param note - The key's note, to name the chords in, or null.
 * @returns The lines, none when the part asks for nothing.
 */
function getPartLines(
  { letter, progression, variation }: PartHarmony,
  note: string | null,
): string[] {
  const name = letter ?? 'The whole song';
  const lines: string[] = [];
  if (progression) {
    const label = progression.name ? ` ("${progression.name}")` : '';
    lines.push(`  - ${name}: ${getChordsText(progression.chords, note)}${label}.`);
  }
  if (letter && variation !== 'same') {
    const ask = getHarmonyOption(VARIATION_ENDINGS, variation)?.ask ?? '';
    const of = progression ? 'it' : `the progression of ${letter}`;
    lines.push(`  - ${letter}′ and other variations of ${letter}: ${of}, with ${ask}.`);
  }
  return lines;
}

/**
 * Returns a progression's chords in words: the numerals, their names in the key, their lengths.
 *
 * @param chords - The chords.
 * @param note - The key's note, or null when the chords cannot be named.
 * @returns The chords, like `i ♭VI ♭III ♭VII (Am F C G), a bar each, 4 bars`.
 */
function getChordsText(chords: Chord[], note: string | null): string {
  const bars = writeBars(getProgressionBars(chords));
  const isEven = chords.every((chord) => chord.bars === chords[0]?.bars);
  const names = note ? chords.map((chord) => getChordName(chord.numeral, note) ?? '?') : null;
  if (isEven) {
    const each = chords[0]?.bars === 1 ? 'a bar' : `${writeBars(chords[0]?.bars ?? 1)} bars`;
    const named = names ? ` (${names.join(' ')})` : '';
    return `${chords.map((chord) => chord.numeral).join(' ')}${named}, ${each} each, ${bars} bars`;
  }
  const listed = chords.map(
    (chord, i) =>
      `${chord.numeral}${names ? ` ${names[i]}` : ''} for ${writeBars(chord.bars)} ${chord.bars > 1 ? 'bars' : 'bar'}`,
  );
  return `${listed.join(', ')}: ${bars} bars`;
}

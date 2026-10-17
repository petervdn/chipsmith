/**
 * A harmony in words: the lines of a prompt that ask for it (its scale, feel and colour, and the
 * progressions kept with their chords named in the key), and the short line the page shows it as.
 * Knows nothing of files or the page.
 */
import { getChordName } from './chord-numerals.ts';
import { COLOURS, FEELS, getHarmonyWord } from './harmony-words.ts';
import type { Chord, PartProgression, SentHarmony } from './harmony.types.ts';
import { getMode } from './modes.ts';
import { getProgressionBars, writeBars } from './progression-notation.ts';

/**
 * Returns the lines of a prompt that ask for a harmony.
 *
 * @param harmony - The harmony sent with the prompt.
 * @returns The lines, starting with an empty one; none for a harmony that asks for nothing.
 */
export function getHarmonyLines(harmony: SentHarmony): string[] {
  const feel = harmony.feel ? getHarmonyWord(FEELS, harmony.feel)?.ask : undefined;
  const colour = harmony.colour ? getHarmonyWord(COLOURS, harmony.colour)?.ask : undefined;
  const lines = [
    getScaleLine(harmony),
    feel ? `- Feel: ${feel}.` : null,
    colour ? `- Colour: ${colour}.` : null,
    ...harmony.parts.map((part) => getPartLine(part, harmony.note)),
  ].filter((line) => line !== null);
  if (lines.length === 0) return [];
  return [
    '',
    'Harmony, for every song; where the prompt itself names a key or chords, the prompt wins:',
    ...lines,
  ];
}

/**
 * Returns a harmony as one short line: its scale, feel and colour, and its progressions.
 *
 * @param harmony - The harmony.
 * @returns The line, like `E phrygian · dark · a little colour · A: Em F Em Dm`; empty when it asks
 *   for nothing.
 */
export function getHarmonySummary(harmony: SentHarmony): string {
  const scale = [harmony.note, harmony.mode].filter(Boolean).join(' ');
  const colour = harmony.colour ? getHarmonyWord(COLOURS, harmony.colour)?.label : undefined;
  const parts = harmony.parts.map(
    ({ letter, progression }) =>
      `${letter ? `${letter}: ` : ''}${progression.name} (${getChordNames(progression.chords, harmony.note).join(' ')})`,
  );
  return [scale, harmony.feel, colour ? `${colour} colour` : null, ...parts]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Names a progression's chords: in the key where it has a note, else as numerals.
 *
 * @param chords - The chords.
 * @param note - The key's note, or null.
 * @returns The names, one per chord.
 */
export function getChordNames(chords: Chord[], note: string | null): string[] {
  return chords.map((chord) =>
    note ? (getChordName(chord.numeral, note) ?? chord.numeral) : chord.numeral,
  );
}

/**
 * Returns the line that asks for a harmony's scale.
 *
 * @param harmony - The harmony.
 * @param harmony.note - The key's note, or null.
 * @param harmony.mode - The mode, or null.
 * @returns The line, or null when both are Claude's choice.
 */
function getScaleLine({ note, mode }: SentHarmony): string | null {
  const sound = mode ? getMode(mode)?.sound : undefined;
  const heard = sound ? ` (${sound})` : '';
  if (note && mode) return `- Scale: ${note} ${mode}${heard}.`;
  if (mode) return `- Scale: ${mode}${heard}, on a note of your choice.`;
  if (note) return `- Key note: ${note}, the scale your choice.`;
  return null;
}

/**
 * Returns the line that asks for a part's progression, heard and kept.
 *
 * @param part - The part's progression.
 * @param part.letter - The part's letter, or null for the whole song.
 * @param part.progression - The progression.
 * @param note - The key's note, to name the chords in, or null.
 * @returns The line.
 */
function getPartLine({ letter, progression }: PartProgression, note: string | null): string {
  const { chords } = progression;
  const where = letter ? `${letter}'s progression` : "The song's progression";
  const numerals = chords.map((chord) => chord.numeral).join(' ');
  const names = note ? ` (${getChordNames(chords, note).join(' ')})` : '';
  const isEven = chords.every((chord) => chord.bars === chords[0]?.bars);
  const first = chords[0]?.bars ?? 1;
  const lengths = isEven
    ? `${first === 1 ? 'a bar' : `${writeBars(first)} bars`} each`
    : `lasting ${chords.map((chord) => writeBars(chord.bars)).join(', ')} bars`;
  const total = writeBars(getProgressionBars(chords));
  return `- ${where}, heard and chosen: ${numerals}${names}, ${lengths}, ${total} bars round; Roman numerals on the major scale of the key, written in ${progression.mode}. Use it as the part's harmony, repeated to fill it; vary its voicing and rhythm, and let its variations end their own way.`;
}

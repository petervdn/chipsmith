/**
 * A progression as it is read off a lead sheet: its chords' names bar by bar, the bars separated by
 * a line, chords that share a bar side by side, a bar a chord is held through marked –. Knows nothing
 * of the page.
 */
import { getChordNames } from '../../shared/harmony-prompt.ts';
import type { Chord } from '../../shared/harmony.types.ts';

/** What a bar a chord is held through shows. */
const HELD = '–';
/** How far a length may be off a whole bar and still count as one, for lengths like ⅓ that do not add up. */
const SLACK = 0.001;

/**
 * Returns a progression's chords bar by bar.
 *
 * @param chords - The chords.
 * @param note - The key's note to name them in, or null for their numerals.
 * @returns A list per bar of what it shows: the names of the chords that start in it, or – for a bar
 *   a chord is held through.
 */
export function getChordBars(chords: Chord[], note: string | null): string[][] {
  const names = getChordNames(chords, note);
  const bars: string[][] = [];
  let start = 0;
  chords.forEach((chord, i) => {
    const first = Math.floor(start + SLACK);
    const end = start + chord.bars;
    (bars[first] ??= []).push(names[i] ?? chord.numeral);
    for (let bar = first + 1; bar < end - SLACK; bar += 1) (bars[bar] ??= []).push(HELD);
    start = end;
  });
  return bars;
}

/**
 * Writes a progression's chords bar by bar, as one line.
 *
 * @param chords - The chords.
 * @param note - The key's note to name them in, or null for their numerals.
 * @returns The line, like `Am | F | C | G` or `C | F | A♭ B♭ | C`.
 */
export function writeChordBars(chords: Chord[], note: string | null): string {
  return getChordBars(chords, note)
    .map((bar) => bar.join(' '))
    .join(' | ');
}

/**
 * The words a song's harmony is asked for in, besides its scale: the feel (which chords, said in
 * plain words) and the colour (how much from outside the scale). Each with how the page shows it
 * and how a prompt asks for it. Knows nothing of files or the page.
 */

/** A choice of a harmony's feel or colour: its value, its label, and how a prompt asks for it. */
export type HarmonyWord = { value: string; label: string; ask: string };

/** The feels: what the chords should do, in plain words. */
export const FEELS: HarmonyWord[] = [
  {
    value: 'bright',
    label: 'bright',
    ask: 'bright and open: major chords forward, clear resolutions',
  },
  {
    value: 'bittersweet',
    label: 'bittersweet',
    ask: 'bittersweet: major and minor side by side, a sad chord in a happy place or the other way round',
  },
  { value: 'dark', label: 'dark', ask: 'dark: minor chords, flat-side colour, heavy resolutions' },
  {
    value: 'heroic',
    label: 'heroic',
    ask: 'heroic: strong root movement by fourths and fifths, major chords from the flat side (♭VI, ♭VII) rising to the tonic',
  },
  {
    value: 'dreamy',
    label: 'dreamy',
    ask: 'dreamy: sevenths and ninths, slow changes, little pull to resolve',
  },
  {
    value: 'tense',
    label: 'tense',
    ask: 'tense: diminished and suspended chords, a dominant held long, chromatic steps',
  },
  {
    value: 'floating',
    label: 'floating',
    ask: 'floating: chords that do not land, pedal notes, suspended chords and open fifths',
  },
];

/** The colours: how much of the harmony comes from outside the scale. */
export const COLOURS: HarmonyWord[] = [
  { value: 'plain', label: 'plain', ask: 'only chords of the scale' },
  {
    value: 'little',
    label: 'a little',
    ask: 'now and then a chord borrowed from outside the scale (modal interchange), mostly leading into sections and at their ends',
  },
  {
    value: 'lots',
    label: 'lots',
    ask: 'colourful: borrowed chords, secondary dominants and chromatic mediants throughout',
  },
];

/**
 * Returns a feel or colour by its value.
 *
 * @param words - The feels or the colours.
 * @param value - The value.
 * @returns The word, or undefined for a value that is not one.
 */
export function getHarmonyWord(words: HarmonyWord[], value: string): HarmonyWord | undefined {
  return words.find((word) => word.value === value);
}

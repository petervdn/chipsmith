/**
 * A chord as notes to play in a preview: its root low for a bass, and its tones in the middle,
 * worked out from its numeral (shared/chord-numerals.ts) and the key's note. Knows nothing of the
 * page or of audio.
 */
import type { ChordAddition, ChordQuality } from '../../shared/chord-numerals.ts';
import { getNotePitch, readNumeral } from '../../shared/chord-numerals.ts';

/** A chord as notes: its bass and its tones, as MIDI note numbers. */
export type Voicing = { bass: number; tones: number[] };

/** The semitones above the root of each quality's tones. */
const QUALITY_TONES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  'half-diminished': [0, 3, 6, 10],
  augmented: [0, 4, 8],
} satisfies Record<ChordQuality, number[]>;
/** The MIDI note of the C an octave below the bass's lowest, and of middle C. */
const BASS_C = 36;
const MIDDLE_C = 60;
/** The highest a chord's root goes in the middle before it is taken down an octave. */
const HIGHEST_ROOT = 66;
/** The semitones above a chord's root of the tones added to it. */
const SECOND = 2;
const FOURTH = 5;
const SIXTH = 9;
const MINOR_SEVENTH = 10;
const MAJOR_SEVENTH = 11;
const OCTAVE = 12;
const NINTH = 14;

/**
 * Returns the notes a chord is played with in a key.
 *
 * @param text - The chord's numeral.
 * @param note - The key's note.
 * @returns The chord's bass and tones, or null when the numeral or the note does not read.
 */
export function getVoicing(text: string, note: string): Voicing | null {
  const numeral = readNumeral(text);
  const keyPitch = getNotePitch(note);
  if (!numeral || keyPitch === null) return null;
  const rootPitch = (keyPitch + numeral.semitones) % OCTAVE;
  const middleRoot =
    MIDDLE_C + rootPitch > HIGHEST_ROOT ? MIDDLE_C + rootPitch - OCTAVE : MIDDLE_C + rootPitch;
  const tones = addTones(QUALITY_TONES[numeral.quality], numeral.quality, numeral.addition);
  return { bass: BASS_C + rootPitch, tones: tones.map((tone) => middleRoot + tone) };
}

/**
 * Returns a chord's tones with what is added to it.
 *
 * @param tones - The tones of its quality, in semitones above the root.
 * @param quality - Its quality.
 * @param addition - What is added.
 * @returns The tones, in semitones above the root.
 */
function addTones(tones: number[], quality: ChordQuality, addition: ChordAddition): number[] {
  const [root = 0, third = 4, fifth = 7] = tones;
  const seventh = quality === 'diminished' ? SIXTH : MINOR_SEVENTH;
  const added = {
    '': tones,
    '7': quality === 'half-diminished' ? tones : [...tones, seventh],
    maj7: [root, third, fifth, MAJOR_SEVENTH],
    '6': [...tones, SIXTH],
    '9': [...tones, MINOR_SEVENTH, NINTH],
    add9: [...tones, NINTH],
    sus2: [root, SECOND, fifth],
    sus4: [root, FOURTH, fifth],
    '5': [root, fifth, OCTAVE],
  } satisfies Record<ChordAddition, number[]>;
  return added[addition];
}

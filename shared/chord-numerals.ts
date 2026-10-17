/**
 * A chord written as a Roman numeral on the major scale of the key: `♭VI`, `ii7`, `V7`, `viiø7`,
 * `♭VII5`. Upper case is major and lower case minor; a mark after it makes it diminished (°),
 * half-diminished (ø) or augmented (+); what follows adds to it (7, maj7, 6, 9, add9, sus2, sus4, or
 * 5 for a power chord). Read, written back the one way, and named in a key (`♭VI` in A is F); a
 * key's note as a pitch.
 * Knows nothing of files or the page.
 */

/** What a chord is built as, from its numeral's case and mark. */
export type ChordQuality = 'major' | 'minor' | 'diminished' | 'half-diminished' | 'augmented';

/** What can follow a numeral, added to its chord. */
const ADDITIONS = ['maj7', 'add9', 'sus2', 'sus4', '7', '6', '9', '5', ''] as const;

/** What is added to a chord. */
export type ChordAddition = (typeof ADDITIONS)[number];

/** A numeral read. */
export type Numeral = {
  /** Its degree of the scale, 0 for I to 6 for VII. */
  degree: number;
  /** How far its root is above the key's note, in semitones, 0 to 11. */
  semitones: number;
  quality: ChordQuality;
  addition: ChordAddition;
};

/** The semitones above the key's note of each degree of its major scale, I to VII. */
export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
/** The semitones in an octave. */
const OCTAVE = 12;
/** The degrees as numerals, I to VII. */
const DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** The letters of the notes, C to B, in the order of MAJOR_STEPS. */
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
/** The notes by semitone above C, named with sharps and with flats. */
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
/** Names a key's spelling avoids: they are written as the note they sound (B, E, F, C). */
const AWKWARD_NAMES = ['C♭', 'F♭', 'E♯', 'B♯'];
/** A numeral: an accidental, the degree, a mark, an addition. */
const NUMERAL =
  /^([♭♯]?)(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)([°ø+]?)(maj7|add9|sus2|sus4|7|6|9|5)?$/;

/** How a chord of each quality is named, by what is added; what is not here is its base and the addition. */
const CHORD_SUFFIXES = {
  major: { '': '' },
  minor: { '': 'm', maj7: 'm(maj7)', add9: 'm(add9)', sus2: 'sus2', sus4: 'sus4', '5': '5' },
  diminished: { '': 'dim', '7': 'dim7' },
  'half-diminished': { '': 'm7♭5', '7': 'm7♭5' },
  augmented: { '': 'aug', '7': '7♯5', maj7: 'maj7♯5' },
} satisfies Record<ChordQuality, Partial<Record<ChordAddition, string>>>;

/**
 * Reads a numeral. `b` and `#` are taken for ♭ and ♯, `o` for °.
 *
 * @param text - The numeral, like `♭VI`, `bVI`, `ii7`, `viio`.
 * @returns The numeral read, or null when it is not one.
 */
export function readNumeral(text: string): Numeral | null {
  const typed = text.trim().replace(/^b/, '♭').replace(/^#/, '♯').replace('o', '°');
  const match = NUMERAL.exec(typed);
  if (!match) return null;
  const [, accidental = '', roman = '', mark = '', addition = ''] = match;
  const degree = DEGREES.indexOf(roman.toUpperCase());
  const isUpper = roman === roman.toUpperCase();
  const quality = getQuality(isUpper, mark);
  const step = MAJOR_STEPS[degree];
  if (!quality || step === undefined || !isAddition(addition)) return null;
  const shift = accidental === '♭' ? -1 : accidental === '♯' ? 1 : 0;
  return { degree, semitones: (step + shift + OCTAVE) % OCTAVE, quality, addition };
}

/**
 * Writes a numeral the one way: ♭ and ♯, °, ø (always with its 7).
 *
 * @param numeral - The numeral.
 * @param numeral.degree - Its degree, 0 for I.
 * @param numeral.semitones - Its root above the key's note.
 * @param numeral.quality - What it is built as.
 * @param numeral.addition - What is added to it.
 * @returns The numeral written, like `♭VI`, `iiø7`.
 */
export function writeNumeral({ degree, semitones, quality, addition }: Numeral): string {
  const shift = getShift(semitones, MAJOR_STEPS[degree] ?? 0);
  const accidental = shift < 0 ? '♭' : shift > 0 ? '♯' : '';
  const roman = DEGREES[degree] ?? 'I';
  const isUpper = quality === 'major' || quality === 'augmented';
  const mark = { major: '', minor: '', diminished: '°', 'half-diminished': 'ø', augmented: '+' }[
    quality
  ];
  const written = quality === 'half-diminished' && addition === '' ? '7' : addition;
  return `${accidental}${isUpper ? roman : roman.toLowerCase()}${mark}${written}`;
}

/**
 * Writes a numeral the one way, from how it was typed.
 *
 * @param text - The numeral as typed.
 * @returns The numeral written, or null when it is not one.
 */
export function normalizeNumeral(text: string): string | null {
  const numeral = readNumeral(text);
  return numeral ? writeNumeral(numeral) : null;
}

/**
 * Names a chord in a key: its root spelled from the key's letter, and its quality.
 *
 * @param text - The chord's numeral.
 * @param note - The key's note, like `A`, `C♯`, `E♭`.
 * @returns The chord's name (`♭VI` in A is `F`, `ii7` in C is `Dm7`), or null when the numeral or
 *   the note does not read.
 */
export function getChordName(text: string, note: string): string | null {
  const numeral = readNumeral(text);
  const key = readNote(note);
  if (!numeral || !key) return null;
  const root = getRootName(numeral, key);
  const suffixes: Partial<Record<ChordAddition, string>> = CHORD_SUFFIXES[numeral.quality];
  const base = suffixes[''] ?? '';
  return `${root}${suffixes[numeral.addition] ?? `${base}${numeral.addition}`}`;
}

/**
 * Returns a key's note as a pitch.
 *
 * @param note - The note, like `A`, `C♯`, `Eb`.
 * @returns Its pitch in semitones above C, 0 to 11, or null when it does not read.
 */
export function getNotePitch(note: string): number | null {
  return readNote(note)?.pitch ?? null;
}

/**
 * Returns how many semitones a pitch is from another, the shorter way round.
 *
 * @param pitch - The pitch, in semitones above C.
 * @param from - The pitch it is measured from.
 * @returns The distance, -6 to 5.
 */
function getShift(pitch: number, from: number): number {
  return ((((pitch - from + OCTAVE / 2) % OCTAVE) + OCTAVE) % OCTAVE) - OCTAVE / 2;
}

/**
 * Reads a key's note.
 *
 * @param note - The note, like `A`, `C♯`, `Eb`.
 * @returns Its letter (0 for C to 6 for B) and its pitch in semitones above C, or null.
 */
function readNote(note: string): { letter: number; pitch: number } | null {
  const match = /^([A-G])([♭♯b#]?)$/.exec(note.trim());
  if (!match) return null;
  const [, name = '', accidental = ''] = match;
  const letter = LETTERS.indexOf(name);
  const shift = accidental === '' ? 0 : '♭b'.includes(accidental) ? -1 : 1;
  return { letter, pitch: ((MAJOR_STEPS[letter] ?? 0) + shift + OCTAVE) % OCTAVE };
}

/**
 * Spells a chord's root in a key: the letter its degree is on, with the accidental it needs; a
 * spelling that needs two, or is awkward (C♭), is written as the note it sounds.
 *
 * @param numeral - The chord's numeral.
 * @param key - The key's note, read.
 * @param key.letter - Its letter, 0 for C to 6 for B.
 * @param key.pitch - Its pitch, in semitones above C.
 * @returns The root's name.
 */
function getRootName(numeral: Numeral, { letter, pitch }: { letter: number; pitch: number }) {
  const letterIndex = (letter + numeral.degree) % LETTERS.length;
  const rootPitch = (pitch + numeral.semitones) % OCTAVE;
  const shift = getShift(rootPitch, MAJOR_STEPS[letterIndex] ?? 0);
  const name = `${LETTERS[letterIndex] ?? 'C'}${shift < 0 ? '♭' : shift > 0 ? '♯' : ''}`;
  if (Math.abs(shift) <= 1 && !AWKWARD_NAMES.includes(name)) return name;
  const isFlat = numeral.semitones < (MAJOR_STEPS[numeral.degree] ?? 0);
  return (isFlat ? FLAT_NAMES : SHARP_NAMES)[rootPitch] ?? 'C';
}

/**
 * Returns a numeral's quality from its case and mark.
 *
 * @param isUpper - Whether the numeral is upper case.
 * @param mark - The mark after it: °, ø, + or none.
 * @returns The quality, or null for a mark the case cannot take (° on upper case, + on lower).
 */
function getQuality(isUpper: boolean, mark: string): ChordQuality | null {
  if (isUpper) return mark === '' ? 'major' : mark === '+' ? 'augmented' : null;
  return mark === ''
    ? 'minor'
    : mark === '°'
      ? 'diminished'
      : mark === 'ø'
        ? 'half-diminished'
        : null;
}

/**
 * Returns whether a text is an addition to a chord.
 *
 * @param text - The text after a numeral and its mark.
 * @returns True when it is one.
 */
function isAddition(text: string): text is ChordAddition {
  return ADDITIONS.some((addition) => addition === text);
}

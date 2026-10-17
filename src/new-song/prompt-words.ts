/**
 * The words a built prompt is made of, a list per part: moods, the key's note and mode, kinds of
 * piece (each one song, so said once: "a waltz"), rhythms, and ideas to build it around. What does
 * not go together is marked where it is said: a piece that has its own meter or pace, a rhythm's
 * meter and pace, an idea only one chip can play. The ideas are about the music, not its form:
 * where sections fall is the Structure panel's. Knows nothing of the page.
 */
import type { ChipName } from '../../shared/chips.ts';

/** How fast a rhythm goes, where it says so. */
export type Pace = 'slow' | 'fast';

/** A kind of piece, with the meters and paces it can take (any when left out). */
export type Piece = { text: string; meters?: string[]; paces?: Pace[] };

/** A rhythm: its words, and the meter and pace they set (none when left out). */
export type Rhythm = { text: string; meter?: string; pace?: Pace };

/** An idea to build a piece around, and the chip it needs (any when left out). */
export type Idea = { text: string; chip?: ChipName };

/** The moods; a piece's sentence starts with one. */
export const MOODS = [
  'dark',
  'sunny',
  'melancholic',
  'frantic',
  'dreamy',
  'tense',
  'triumphant',
  'eerie',
  'playful',
  'brooding',
  'hopeful',
  'mysterious',
  'nostalgic',
  'aggressive',
  'calm',
  'bittersweet',
  'heroic',
  'lonely',
  'mischievous',
  'urgent',
  'cold',
  'warm',
  'cheeky',
  'solemn',
  'restless',
];

/** The notes a key is on. */
export const NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/** The modes and scales a key is in. */
export const MODES = [
  'major',
  'minor',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'harmonic minor',
  'phrygian dominant',
  'blues',
];

/** The kinds of piece, each said as one. */
export const PIECES: Piece[] = [
  { text: 'funk groove' },
  { text: 'boss battle theme' },
  { text: 'title screen theme' },
  { text: 'town theme' },
  { text: 'fugue' },
  { text: 'ambient loop' },
  { text: 'breakbeat track' },
  { text: 'chase theme', paces: ['fast'] },
  { text: 'end credits theme' },
  { text: 'puzzle game loop' },
  { text: 'overworld theme' },
  { text: 'dungeon theme' },
  { text: 'underwater level theme' },
  { text: 'castle theme' },
  { text: 'shop theme' },
  { text: 'game over jingle' },
  { text: 'level clear fanfare' },
  { text: 'night level theme' },
  { text: 'racing theme', paces: ['fast'] },
  { text: 'space shooter stage theme' },
  { text: 'march', meters: ['2/4', '4/4', '6/8'] },
  { text: 'waltz', meters: ['3/4'] },
  { text: 'lullaby', meters: ['3/4', '4/4', '6/8', '12/8'], paces: ['slow'] },
  { text: 'disco track', meters: ['4/4'] },
  { text: 'rock anthem' },
  { text: 'jazz ballad', paces: ['slow'] },
  { text: 'bossa nova', meters: ['2/4', '4/4'] },
  { text: 'drum and bass track' },
  { text: 'synth-pop song' },
  { text: 'baroque dance' },
];

/** The rhythms: a meter, a tempo, or a feel. */
export const RHYTHMS: Rhythm[] = [
  { text: 'in 4/4', meter: '4/4' },
  { text: 'in a straight 4/4 at 120 bpm', meter: '4/4' },
  { text: 'in 4/4 with a backbeat', meter: '4/4' },
  { text: 'four on the floor', meter: '4/4' },
  { text: 'at a relaxed 90 bpm', pace: 'slow' },
  { text: 'at a driving 140 bpm', pace: 'fast' },
  { text: 'in 3/4', meter: '3/4' },
  { text: 'in 6/8', meter: '6/8' },
  { text: 'in 2/4 like a march', meter: '2/4' },
  { text: 'in 12/8', meter: '12/8' },
  { text: 'in 7/8', meter: '7/8' },
  { text: 'in 5/4', meter: '5/4' },
  { text: 'in 11/16', meter: '11/16' },
  { text: 'in 9/8', meter: '9/8' },
  { text: 'with a swung shuffle' },
  { text: 'at a slow 70 bpm', pace: 'slow' },
  { text: 'at a racing 170 bpm', pace: 'fast' },
  { text: 'in half-time', pace: 'slow' },
  { text: 'in double-time', pace: 'fast' },
  { text: 'with a syncopated groove' },
];

/** The ideas to build a piece around. */
export const IDEAS: Idea[] = [
  { text: 'with a walking bass' },
  { text: 'built around a call-and-response hook' },
  { text: 'where the triangle carries the melody', chip: 'nes' },
  { text: 'with arpeggiated chords' },
  { text: 'with the noise channel playing a breakbeat', chip: 'nes' },
  { text: 'with an echo on the lead' },
  { text: 'with a catchy whistled-style melody' },
  { text: 'with a counter-melody against the lead' },
  { text: 'with stabbing chords on the offbeat' },
  { text: 'with a pedal note under changing chords' },
  { text: 'with vibrato on the lead' },
  { text: 'with pitch slides in the bass' },
  { text: 'that ends on an unresolved chord' },
  { text: 'with a melody that climbs throughout' },
  { text: 'with a riff passed between the channels' },
  { text: 'with fast arpeggio runs' },
  { text: 'with sparse drums and lots of space' },
  { text: 'with a hook built on three notes' },
  { text: 'with call-and-response between the two pulses', chip: 'nes' },
  { text: 'with ghost notes on the snare' },
  { text: 'with the melody in thirds' },
  { text: 'with a dotted rhythm in the lead' },
  { text: 'with a bass that jumps in octaves' },
  { text: 'with a chromatic line in the bass' },
  { text: 'with the melody doubled in octaves' },
];

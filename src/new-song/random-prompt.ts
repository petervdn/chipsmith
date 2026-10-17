/**
 * A prompt built from parts, to start from on the New page: how many songs, a mood, a kind of piece,
 * the chips, a rhythm and one thing to build it around. Each part is picked from its list, at random
 * or by hand, and a part can be kept while the others are picked again. Knows nothing of the page.
 */

/**
 * The parts, in the order a prompt joins them. The ideas are about the music, not its form: where
 * sections fall is the Structure panel's.
 */
const COUNTS = ['One', 'Two', 'Three'];
const MOODS = [
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
const PIECES = [
  'funk grooves',
  'boss battle themes',
  'title screen themes',
  'town themes',
  'fugues',
  'ambient loops',
  'breakbeat tracks',
  'chase themes',
  'end credits themes',
  'puzzle game loops',
  'overworld themes',
  'dungeon themes',
  'underwater levels',
  'castle themes',
  'shop themes',
  'game over jingles',
  'level clear fanfares',
  'night levels',
  'racing themes',
  'space shooter stages',
  'marches',
  'waltzes',
  'lullabies',
  'disco tracks',
  'rock anthems',
  'jazz ballads',
  'bossa novas',
  'drum and bass tracks',
  'synth-pop songs',
  'baroque dances',
];
const CHIPS = ['for the NES', 'for the NES with the SCC'];
const RHYTHMS = [
  'in 4/4',
  'in a straight 4/4 at 120 bpm',
  'in 4/4 with a backbeat',
  'four on the floor',
  'at a relaxed 90 bpm',
  'at a driving 140 bpm',
  'in 3/4',
  'in 6/8',
  'in 2/4 like a march',
  'in 12/8',
  'in 7/8',
  'in 5/4',
  'in 11/16',
  'in 9/8',
  'with a swung shuffle',
  'at a slow 70 bpm',
  'at a racing 170 bpm',
  'in half-time',
  'in double-time',
  'with a syncopated groove',
];
const IDEAS = [
  'with a walking bass',
  'built around a call-and-response hook',
  'where the triangle carries the melody',
  'with arpeggiated chords',
  'with the noise channel playing a breakbeat',
  'with an echo on the lead',
  'with a catchy whistled-style melody',
  'with a counter-melody against the lead',
  'with stabbing chords on the offbeat',
  'with a pedal note under changing chords',
  'with vibrato on the lead',
  'with pitch slides in the bass',
  'that ends on an unresolved chord',
  'with a melody that climbs throughout',
  'with a riff passed between the channels',
  'with fast arpeggio runs',
  'with sparse drums and lots of space',
  'with a hook built on three notes',
  'with call-and-response between the two pulses',
  'with ghost notes on the snare',
  'with the melody in thirds',
  'with a dotted rhythm in the lead',
  'with a bass that jumps in octaves',
  'with a chromatic line in the bass',
  'with the melody doubled in octaves',
];

/** The parts of a prompt, by name, each a value from its list. */
export type PromptParts = {
  count: string;
  mood: string;
  piece: string;
  chips: string;
  rhythm: string;
  idea: string;
};

/** A part's name. */
export type PartName = keyof PromptParts;

/** Each part's label and the values it is picked from, in the order the builder shows them. */
export const PROMPT_PARTS: { name: PartName; label: string; values: string[] }[] = [
  { name: 'count', label: 'Songs', values: COUNTS },
  { name: 'mood', label: 'Mood', values: MOODS },
  { name: 'piece', label: 'Piece', values: PIECES },
  { name: 'chips', label: 'Chips', values: CHIPS },
  { name: 'rhythm', label: 'Rhythm', values: RHYTHMS },
  { name: 'idea', label: 'Idea', values: IDEAS },
];

/**
 * Picks every part again at random, except the kept ones.
 *
 * @param parts - The parts now, or null to pick them all.
 * @param kept - The parts that keep their value.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The parts, the kept ones as they were.
 */
export function rollParts(
  parts: PromptParts | null,
  kept: PartName[],
  getRandom: () => number,
): PromptParts {
  function pick(name: PartName, values: string[]): string {
    if (parts && kept.includes(name)) return parts[name];
    return values[Math.floor(getRandom() * values.length)] ?? values[0] ?? '';
  }
  return {
    count: pick('count', COUNTS),
    mood: pick('mood', MOODS),
    piece: pick('piece', PIECES),
    chips: pick('chips', CHIPS),
    rhythm: pick('rhythm', RHYTHMS),
    idea: pick('idea', IDEAS),
  };
}

/**
 * Returns the prompt its parts make: one sentence.
 *
 * @param parts - The parts.
 * @param parts.count - How many songs ("One", "Two", "Three").
 * @param parts.mood - The mood.
 * @param parts.piece - The kind of piece.
 * @param parts.chips - The chips, as "for the NES".
 * @param parts.rhythm - The meter or tempo.
 * @param parts.idea - One thing to build it around.
 * @returns The prompt, "song" for one song and "songs" for more.
 */
export function getPromptText({ count, mood, piece, chips, rhythm, idea }: PromptParts): string {
  const song = count === 'One' ? 'song' : 'songs';
  return `${count} ${mood} ${song}: ${piece} ${chips}, ${rhythm}, ${idea}.`;
}

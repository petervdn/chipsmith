/**
 * A prompt built from parts, to start from on the New page: how many songs, a mood, a kind of piece,
 * the chips, a rhythm and one thing to build it around. Each part is picked from its list, at random
 * or by hand, and a part can be kept while the others are picked again; the chips are a set, usually
 * one, sometimes two. Knows nothing of the page.
 */
import type { ChipName } from '../../shared/chips.ts';
import { CHIP_LABELS, CHIP_NAMES } from '../../shared/chips.ts';

/**
 * The parts, in the order a prompt joins them. The ideas are about the music, not its form: where
 * sections fall is the Structure panel's.
 */
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
/** How often a roll picks two chips instead of one. */
const TWO_CHIPS_CHANCE = 1 / 3;
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
  mood: string;
  piece: string;
  /** The chips, one or more, in the order of CHIP_NAMES. */
  chips: ChipName[];
  rhythm: string;
  idea: string;
};

/** A part's name. */
export type PartName = keyof PromptParts;

/** The name of a part picked from a list of words: every part but the chips. */
export type ListPartName = Exclude<PartName, 'chips'>;

/** Each list part's label and the values it is picked from, in the order the builder shows them. */
export const PROMPT_PARTS: { name: ListPartName; label: string; values: string[] }[] = [
  { name: 'mood', label: 'Mood', values: MOODS },
  { name: 'piece', label: 'Piece', values: PIECES },
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
  function pick(name: ListPartName, values: string[]): string {
    if (parts && kept.includes(name)) return parts[name];
    return values[Math.floor(getRandom() * values.length)] ?? values[0] ?? '';
  }
  return {
    mood: pick('mood', MOODS),
    piece: pick('piece', PIECES),
    chips: parts && kept.includes('chips') ? parts.chips : rollChips(getRandom),
    rhythm: pick('rhythm', RHYTHMS),
    idea: pick('idea', IDEAS),
  };
}

/**
 * Picks chips at random: one, or now and then two, never the same twice.
 *
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The chips, in the order of CHIP_NAMES.
 */
export function rollChips(getRandom: () => number): ChipName[] {
  const count = getRandom() < TWO_CHIPS_CHANCE ? 2 : 1;
  const left: ChipName[] = [...CHIP_NAMES];
  const picked: ChipName[] = [];
  while (picked.length < count && left.length > 0) {
    const [chip] = left.splice(Math.floor(getRandom() * left.length), 1);
    if (chip) picked.push(chip);
  }
  return CHIP_NAMES.filter((chip) => picked.includes(chip));
}

/**
 * Returns the chips in words, as the prompt says them.
 *
 * @param chips - The chips.
 * @returns "for the NES", "for the NES and the SCC", "for the NES, the SCC and the SID".
 */
export function getChipsText(chips: ChipName[]): string {
  const names = chips.map((chip) => `the ${CHIP_LABELS[chip]}`);
  const last = names.pop() ?? '';
  return `for ${names.length > 0 ? `${names.join(', ')} and ${last}` : last}`;
}

/**
 * Returns the prompt its parts make: one sentence.
 *
 * @param parts - The parts.
 * @param parts.mood - The mood.
 * @param parts.piece - The kind of piece.
 * @param parts.chips - The chips.
 * @param parts.rhythm - The meter or tempo.
 * @param parts.idea - One thing to build it around.
 * @returns The prompt, one sentence without a count: how many songs is set beside the Create button.
 */
export function getPromptText({ mood, piece, chips, rhythm, idea }: PromptParts): string {
  const chipsText = getChipsText(chips);
  return `${mood.charAt(0).toUpperCase()}${mood.slice(1)} ${piece} ${chipsText}, ${rhythm}, ${idea}.`;
}

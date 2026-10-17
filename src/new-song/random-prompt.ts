/**
 * A prompt built from parts, to start from on the New page: a mood, a kind of piece, the chips, a
 * rhythm and one thing to build it around, said as one song ("A dark waltz for the NES, …"; the
 * key is the Harmony panel's): how many songs is set beside the Create button. Each part is
 * picked from its list (prompt-words.ts), at random or by hand, and a part can be kept while the
 * others are picked again; the chips are a set, usually one, sometimes two. Only what goes together
 * is picked: a rhythm the piece can take, an idea the chips can play. Knows nothing of the page.
 */
import type { ChipName } from '../../shared/chips.ts';
import { CHIP_NAMES, CHIPS } from '../../shared/chips.ts';
import type { Piece, Rhythm } from './prompt-words.ts';
import { IDEAS, MOODS, PIECES, RHYTHMS } from './prompt-words.ts';

/**
 * The chips the prompt builder offers, in the order of CHIP_NAMES. The SID is left out for now: its
 * notes start late now and then (docs/adr/0035); a prompt can still name it.
 */
export const PROMPT_CHIPS: ChipName[] = ['nes', 'psg', 'scc'];

/** The most times a song may ask for one chip. */
const MOST_OF_A_CHIP = 2;

/** A chip's count in words, when a prompt asks for it more than once. */
const COUNT_WORDS = ['', '', 'two'];

/** How often a roll picks two chips instead of one. */
const TWO_CHIPS_CHANCE = 1 / 3;

/** The parts of a prompt, by name, each a value from its list. */
export type PromptParts = {
  mood: string;
  piece: string;
  /** The chips, one or more, in the order of CHIP_NAMES; a chip asked for twice is in it twice. */
  chips: ChipName[];
  rhythm: string;
  idea: string;
};

/** A part's name. */
export type PartName = keyof PromptParts;

/** The name of a part picked from a list of words: every part but the chips. */
export type ListPartName = Exclude<PartName, 'chips'>;

/** Each list part's label, in the order the builder shows them. */
export const PROMPT_PARTS: { name: ListPartName; label: string }[] = [
  { name: 'mood', label: 'Mood' },
  { name: 'piece', label: 'Piece' },
  { name: 'rhythm', label: 'Rhythm' },
  { name: 'idea', label: 'Idea' },
];

/** The parts picked again when they do not go with the others. */
const FITTED_PARTS: ListPartName[] = ['rhythm', 'idea'];

/** The order a roll picks the parts in, so each is picked to go with those before it. */
const ROLL_ORDER: PartName[] = ['mood', 'chips', 'piece', 'rhythm', 'idea'];

/**
 * Returns whether a piece can take a rhythm: its meter and pace, where both say one.
 *
 * @param piece - The piece, or undefined when there is none yet.
 * @param rhythm - The rhythm, or undefined when there is none yet.
 * @returns True when they go together.
 */
function isFitting(piece: Piece | undefined, rhythm: Rhythm | undefined): boolean {
  if (!piece || !rhythm) return true;
  const isMeterFitting = !rhythm.meter || !piece.meters || piece.meters.includes(rhythm.meter);
  const isPaceFitting = !rhythm.pace || !piece.paces || piece.paces.includes(rhythm.pace);
  return isMeterFitting && isPaceFitting;
}

/**
 * Returns the values a part can take with the other parts as they are.
 *
 * @param name - The part.
 * @param parts - The parts; an empty value is none yet, and goes with anything.
 * @returns The part's values that go with the others, in their list's order.
 */
export function getPartValues(name: ListPartName, parts: PromptParts): string[] {
  const piece = PIECES.find((candidate) => candidate.text === parts.piece);
  const rhythm = RHYTHMS.find((candidate) => candidate.text === parts.rhythm);
  const values = {
    mood: () => MOODS,
    piece: () => PIECES.filter((candidate) => isFitting(candidate, rhythm)).map(({ text }) => text),
    rhythm: () =>
      RHYTHMS.filter((candidate) => isFitting(piece, candidate)).map(({ text }) => text),
    idea: () =>
      IDEAS.filter(({ chip }) => !chip || parts.chips.includes(chip)).map(({ text }) => text),
  } satisfies Record<ListPartName, () => string[]>;
  return values[name]();
}

/**
 * Picks every part again at random, except the kept ones, each to go with those picked or kept.
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
  /**
   * Returns whether a part keeps its value.
   *
   * @param name - The part.
   * @returns True when there are parts now and the part is kept.
   */
  function isKept(name: PartName): boolean {
    return parts !== null && kept.includes(name);
  }
  let next: PromptParts = {
    mood: parts && isKept('mood') ? parts.mood : '',
    piece: parts && isKept('piece') ? parts.piece : '',
    chips: parts && isKept('chips') ? parts.chips : [],
    rhythm: parts && isKept('rhythm') ? parts.rhythm : '',
    idea: parts && isKept('idea') ? parts.idea : '',
  };
  for (const name of ROLL_ORDER) {
    if (isKept(name)) continue;
    next =
      name === 'chips'
        ? { ...next, chips: rollChips(getRandom) }
        : { ...next, [name]: pickValue(getPartValues(name, next), getRandom) };
  }
  return next;
}

/**
 * Picks one part again at random, to go with the others, which keep their values (a rhythm or idea
 * that then no longer goes with it is picked again too).
 *
 * @param parts - The parts now.
 * @param name - The part picked again.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The parts, that one picked again.
 */
export function rollPart(parts: PromptParts, name: PartName, getRandom: () => number): PromptParts {
  const others = ROLL_ORDER.filter((other) => other !== name);
  return fitParts(rollParts(parts, others, getRandom), getRandom);
}

/**
 * Picks again, at random, a rhythm the piece cannot take and an idea the chips cannot play: after a
 * part is picked by hand or a chip switched.
 *
 * @param parts - The parts.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The parts, all going together.
 */
export function fitParts(parts: PromptParts, getRandom: () => number): PromptParts {
  const fitted = { ...parts };
  for (const name of FITTED_PARTS) {
    const values = getPartValues(name, fitted);
    if (!values.includes(fitted[name])) fitted[name] = pickValue(values, getRandom);
  }
  return fitted;
}

/**
 * Picks one of some values at random.
 *
 * @param values - The values.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns One of them; an empty string when there are none.
 */
function pickValue(values: string[], getRandom: () => number): string {
  return values[Math.floor(getRandom() * values.length)] ?? values[0] ?? '';
}

/**
 * Picks chips at random: one, or now and then two, never the same twice.
 *
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The chips, in the order of CHIP_NAMES.
 */
export function rollChips(getRandom: () => number): ChipName[] {
  const count = getRandom() < TWO_CHIPS_CHANCE ? 2 : 1;
  const left: ChipName[] = [...PROMPT_CHIPS];
  const picked: ChipName[] = [];
  while (picked.length < count && left.length > 0) {
    const [chip] = left.splice(Math.floor(getRandom() * left.length), 1);
    if (chip) picked.push(chip);
  }
  return PROMPT_CHIPS.filter((chip) => picked.includes(chip));
}

/**
 * Returns the chips after a chip's switch is tapped: off to once, once to twice, twice to off. The
 * last chip on is never switched off: twice goes back to once.
 *
 * @param chips - The chips on, a chip asked for twice in it twice.
 * @param chip - The chip whose switch is tapped.
 * @returns The chips, in the order of CHIP_NAMES.
 */
export function getToggledChips(chips: ChipName[], chip: ChipName): ChipName[] {
  const count = chips.filter((other) => other === chip).length;
  const isOnlyChip = chips.every((other) => other === chip);
  const next = count >= MOST_OF_A_CHIP ? (isOnlyChip ? 1 : 0) : count + 1;
  return CHIP_NAMES.flatMap((name) =>
    name === chip
      ? Array.from({ length: next }, () => name)
      : chips.filter((other) => other === name),
  );
}

/**
 * Returns the chips in words, as the prompt says them.
 *
 * @param chips - The chips, a chip asked for twice in it twice.
 * @returns "for the NES", "for the NES and the SCC", "for two SCCs and the SID".
 */
export function getChipsText(chips: ChipName[]): string {
  const names = CHIP_NAMES.flatMap((chip) => {
    const count = chips.filter((other) => other === chip).length;
    if (count === 0) return [];
    return [
      count === 1
        ? `the ${CHIPS[chip].label}`
        : `${COUNT_WORDS[count] ?? count} ${CHIPS[chip].label}s`,
    ];
  });
  const last = names.pop() ?? '';
  return `for ${names.length > 0 ? `${names.join(', ')} and ${last}` : last}`;
}

/**
 * Returns the prompt its parts make: one sentence, about one song.
 *
 * @param parts - The parts.
 * @param parts.mood - The mood.
 * @param parts.piece - The kind of piece.
 * @param parts.chips - The chips.
 * @param parts.rhythm - The meter, tempo or feel.
 * @param parts.idea - One thing to build it around.
 * @returns The prompt, without a count: how many songs is set beside the Create button.
 */
export function getPromptText({ mood, piece, chips, rhythm, idea }: PromptParts): string {
  const article = /^[aeiou]/i.test(mood) ? 'An' : 'A';
  return `${article} ${mood} ${piece} ${getChipsText(chips)}, ${rhythm}, ${idea}.`;
}

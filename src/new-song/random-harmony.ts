/**
 * The harmony chosen on New: its scale (a mode on a note), feel and colour, each picked by hand or
 * at random, and a progression per part of the structure (or one for the whole song) heard and kept
 * from the presets that fit; and what of it is sent with the prompt. Knows nothing of the page.
 */
import { COLOURS, FEELS } from '../../shared/harmony-words.ts';
import type { PartProgression, Progression, SentHarmony } from '../../shared/harmony.schema.ts';
import { getMode, MODES, NOTES } from '../../shared/modes.ts';
import type { ProgressionPreset } from '../../shared/progression-presets.ts';
import { getPresetsFor } from '../../shared/progression-presets.ts';
import type { Section } from '../../shared/structure.schema.ts';

/** The harmony as it is being chosen: what is null is Claude's choice. */
export type HarmonyChoice = {
  note: string | null;
  mode: string | null;
  feel: string | null;
  colour: string | null;
  /** The progression kept for each part, by its key. */
  progressions: Record<string, Progression>;
};

/** A row of the harmony that is rolled. */
export type HarmonyRowName = 'note' | 'mode' | 'feel' | 'colour';

/** A part a progression is kept for: one of the structure's letters, or the whole song. */
export type HarmonyPart = {
  /** What its progression is kept under. */
  key: string;
  /** Its letter, or null for the whole song. */
  letter: string | null;
};

/** The rows rolled, in the order they are picked. */
export const HARMONY_ROWS: HarmonyRowName[] = ['note', 'mode', 'feel', 'colour'];

/** A harmony that asks for nothing: everything Claude's choice. */
export const OPEN_HARMONY: HarmonyChoice = {
  note: null,
  mode: null,
  feel: null,
  colour: null,
  progressions: {},
};

/** The key a whole song's progression is kept under. */
const WHOLE_SONG = 'whole';
/** The notes a progression is heard on when the key's note is Claude's choice: major and minor. */
const MAJOR_NOTE = 'C';
const MINOR_NOTE = 'A';
/** The semitones of a minor third, which makes a mode minor. */
const MINOR_THIRD = 3;

/**
 * Returns the parts a progression is kept for: each letter of a structure, in the order they come,
 * or the whole song when there is no structure.
 *
 * @param sections - The structure's sections, or null for none.
 * @returns The parts.
 */
export function getHarmonyParts(sections: Section[] | null): HarmonyPart[] {
  if (!sections || sections.length === 0) return [{ key: WHOLE_SONG, letter: null }];
  return [...new Set(sections.map((section) => section.letter))].map((letter) => ({
    key: letter,
    letter,
  }));
}

/**
 * Picks a row again at random, never as Claude's choice.
 *
 * @param choice - The harmony.
 * @param name - The row.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The harmony, that row picked again.
 */
export function rollHarmonyRow(
  choice: HarmonyChoice,
  name: HarmonyRowName,
  getRandom: () => number,
): HarmonyChoice {
  const values = {
    note: NOTES,
    mode: MODES.map((mode) => mode.name),
    feel: FEELS.map((feel) => feel.value),
    colour: COLOURS.map((colour) => colour.value),
  } satisfies Record<HarmonyRowName, string[]>;
  return { ...choice, [name]: pickOne(values[name], getRandom) ?? null };
}

/**
 * Picks every row again at random, except the locked ones; the progressions kept stay.
 *
 * @param choice - The harmony.
 * @param locked - The rows kept.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The harmony, the unlocked rows picked again.
 */
export function rollHarmony(
  choice: HarmonyChoice,
  locked: HarmonyRowName[],
  getRandom: () => number,
): HarmonyChoice {
  return HARMONY_ROWS.reduce(
    (next, name) => (locked.includes(name) ? next : rollHarmonyRow(next, name, getRandom)),
    choice,
  );
}

/**
 * Picks presets to hear for a scale and a feel, different ones, avoiding those just heard where
 * there are enough others.
 *
 * @param choice - The harmony.
 * @param choice.mode - Its mode, or null for any.
 * @param choice.feel - Its feel, or null for any.
 * @param count - How many to pick.
 * @param avoid - The ids of the presets to avoid.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The presets, in the order they are offered.
 */
export function pickCandidates(
  { mode, feel }: HarmonyChoice,
  count: number,
  avoid: string[],
  getRandom: () => number,
): ProgressionPreset[] {
  const all = getPresetsFor(mode, feel);
  const fresh = all.filter((preset) => !avoid.includes(preset.id));
  const pool = fresh.length >= count ? fresh : all;
  const picked: ProgressionPreset[] = [];
  const left = [...pool];
  while (picked.length < count && left.length > 0) {
    const [preset] = left.splice(Math.floor(getRandom() * left.length), 1);
    if (preset) picked.push(preset);
  }
  return pool.filter((preset) => picked.includes(preset));
}

/**
 * Keeps a preset as a part's progression, in the scale chosen; with no scale chosen, the preset's
 * own becomes it, so the chords are heard as written.
 *
 * @param choice - The harmony.
 * @param part - The part.
 * @param preset - The preset kept.
 * @returns The harmony, the part's progression kept.
 */
export function keepProgression(
  choice: HarmonyChoice,
  part: HarmonyPart,
  preset: ProgressionPreset,
): HarmonyChoice {
  const mode = choice.mode ?? preset.modes[0] ?? null;
  const progression: Progression = {
    name: preset.name,
    mode: mode ?? 'major',
    chords: preset.chords,
  };
  return { ...choice, mode, progressions: { ...choice.progressions, [part.key]: progression } };
}

/**
 * Lets go of a part's progression: it is Claude's choice again.
 *
 * @param choice - The harmony.
 * @param part - The part.
 * @returns The harmony, without the part's progression.
 */
export function dropProgression(choice: HarmonyChoice, part: HarmonyPart): HarmonyChoice {
  const progressions = Object.fromEntries(
    Object.entries(choice.progressions).filter(([key]) => key !== part.key),
  );
  return { ...choice, progressions };
}

/**
 * Returns the note progressions are heard on: the key's, or one that suits the scale.
 *
 * @param choice - The harmony.
 * @param choice.note - The key's note, or null.
 * @param choice.mode - The mode, or null.
 * @returns The note.
 */
export function getHearingNote({ note, mode }: HarmonyChoice): string {
  if (note) return note;
  const isMinor = mode ? (getMode(mode)?.steps.includes(MINOR_THIRD) ?? false) : false;
  return isMinor ? MINOR_NOTE : MAJOR_NOTE;
}

/**
 * Returns the harmony to send with a prompt: the progressions of the parts there are now.
 *
 * @param choice - The harmony.
 * @param parts - The parts there are now.
 * @returns The harmony to send, or null when it asks for nothing.
 */
export function getSentHarmony(choice: HarmonyChoice, parts: HarmonyPart[]): SentHarmony | null {
  const kept: PartProgression[] = parts.flatMap((part) => {
    const progression = choice.progressions[part.key];
    return progression ? [{ letter: part.letter, progression }] : [];
  });
  const { note, mode, feel, colour } = choice;
  if (!note && !mode && !feel && !colour && kept.length === 0) return null;
  return { note, mode, feel, colour, parts: kept };
}

/**
 * Picks one of some things at random.
 *
 * @param things - The things.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns One of them, or undefined when there are none.
 */
function pickOne<Thing>(things: readonly Thing[], getRandom: () => number): Thing | undefined {
  return things[Math.floor(getRandom() * things.length)];
}

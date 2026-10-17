/**
 * The harmony chosen on New: its key, its settings, how strictly it is followed, and a progression
 * per part of the structure chosen (or one for the whole song), each picked by hand or at random,
 * and what of it is sent with the prompt. A progression rolled is a preset of the mode or one made
 * up (progression-generator.ts), in the kind of chords asked for. Knows nothing of the page.
 */
import { HARMONY_SETTINGS, setHarmonySetting } from '../../shared/harmony-settings.ts';
import type {
  HarmonyOption,
  HarmonySettingName,
  Strictness,
  VariationEnding,
} from '../../shared/harmony-settings.ts';
import type {
  Chord,
  HarmonySettings,
  PartHarmony,
  Progression,
  SentHarmony,
} from '../../shared/harmony.types.ts';
import { getMode, MODES, NOTES } from '../../shared/modes.ts';
import { getProgressionBars, writeBars } from '../../shared/progression-notation.ts';
import { getModePresets } from '../../shared/progression-presets.ts';
import type { Section } from '../../shared/structure.types.ts';
import { generateProgression, getCycleBars, setChordKind } from './progression-generator.ts';

/** The harmony as it is being chosen: what is null is Claude's choice. */
export type HarmonyChoice = {
  note: string | null;
  mode: string | null;
  settings: HarmonySettings;
  strictness: Strictness;
  /** The progression of each part, by its key. */
  progressions: Record<string, Progression | null>;
  /** How the variations of each part end, by its key. */
  variations: Record<string, VariationEnding>;
};

/** A row of the harmony that is rolled: the key's note, its mode, or a setting. */
export type HarmonyRowName = 'note' | 'mode' | HarmonySettingName;

/** A part a progression is chosen for: one of the structure's letters, or the whole song. */
export type HarmonyPart = {
  /** What its progression is kept under. */
  key: string;
  /** Its letter, or null for the whole song. */
  letter: string | null;
  /** The bars of its first section, or null for the whole song. */
  bars: number | null;
  /** Whether the structure has variations of it (A′). */
  hasVariations: boolean;
};

/** The rows rolled, in the order they are picked. */
export const HARMONY_ROWS: HarmonyRowName[] = [
  'note',
  'mode',
  'chords',
  'colour',
  'rhythm',
  'bass',
  'cadence',
  'keyChange',
];

/** A harmony that asks for nothing: everything Claude's choice. */
export const OPEN_HARMONY: HarmonyChoice = {
  note: null,
  mode: null,
  settings: {
    chords: null,
    colour: null,
    rhythm: null,
    bass: null,
    cadence: null,
    keyChange: null,
  },
  strictness: 'exact',
  progressions: {},
  variations: {},
};

/** The key a whole song's progression is kept under. */
const WHOLE_SONG = 'whole';
/** How often a rolled progression is a preset of the mode rather than one made up. */
const PRESET_CHANCE = 0.4;
/** The mode a progression is made up in when the mode is Claude's choice. */
const DEFAULT_MODE = 'major';

/**
 * Returns the parts a progression is chosen for: each letter of a structure, in the order they
 * come, or the whole song when there is no structure.
 *
 * @param sections - The structure's sections, or null for none.
 * @returns The parts.
 */
export function getHarmonyParts(sections: Section[] | null): HarmonyPart[] {
  if (!sections || sections.length === 0) {
    return [{ key: WHOLE_SONG, letter: null, bars: null, hasVariations: false }];
  }
  const letters = [...new Set(sections.map((section) => section.letter))];
  return letters.map((letter) => {
    const ofLetter = sections.filter((section) => section.letter === letter);
    return {
      key: letter,
      letter,
      bars: ofLetter[0]?.bars ?? null,
      hasVariations: ofLetter.some((section) => section.variant > 0),
    };
  });
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
  if (name === 'note') return { ...choice, note: pickOne(NOTES, getRandom) ?? null };
  if (name === 'mode') {
    return { ...choice, mode: pickOne(MODES, getRandom)?.name ?? null };
  }
  return { ...choice, settings: rollSetting(choice.settings, name, getRandom) };
}

/**
 * Picks a part's progression again at random: now and then a preset of the mode, else one made up
 * from the settings; in the kind of chords asked for.
 *
 * @param choice - The harmony.
 * @param part - The part.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The harmony, the part's progression picked again.
 */
export function rollProgression(
  choice: HarmonyChoice,
  part: HarmonyPart,
  getRandom: () => number,
): HarmonyChoice {
  const mode = getMode(choice.mode ?? DEFAULT_MODE) ?? MODES[0];
  if (!mode) return choice;
  const presets = getModePresets(choice.mode);
  const preset = getRandom() < PRESET_CHANCE ? pickOne(presets, getRandom) : undefined;
  const progression: Progression = preset
    ? {
        name: preset.name,
        chords: preset.chords.map((chord) => ({
          ...chord,
          numeral: setChordKind(chord.numeral, choice.settings.chords, mode),
        })),
      }
    : {
        name: 'rolled',
        chords: generateProgression(
          {
            mode,
            settings: choice.settings,
            bars: getCycleBars(part.bars, choice.settings.rhythm),
          },
          getRandom,
        ),
      };
  return setProgression(choice, part, progression);
}

/**
 * Picks every row and part again at random, except the locked ones.
 *
 * @param choice - The harmony.
 * @param parts - The parts there are.
 * @param locked - The rows and parts kept (a part by `getPartLock`).
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The harmony, the unlocked rows and parts picked again.
 */
export function rollHarmony(
  choice: HarmonyChoice,
  parts: HarmonyPart[],
  locked: string[],
  getRandom: () => number,
): HarmonyChoice {
  let next = choice;
  for (const name of HARMONY_ROWS) {
    if (!locked.includes(name)) next = rollHarmonyRow(next, name, getRandom);
  }
  for (const part of parts) {
    if (!locked.includes(getPartLock(part))) next = rollProgression(next, part, getRandom);
  }
  return next;
}

/**
 * Sets a part's progression.
 *
 * @param choice - The harmony.
 * @param part - The part.
 * @param progression - Its progression, or null for Claude's choice.
 * @returns The harmony, the part's progression set.
 */
export function setProgression(
  choice: HarmonyChoice,
  part: HarmonyPart,
  progression: Progression | null,
): HarmonyChoice {
  return { ...choice, progressions: { ...choice.progressions, [part.key]: progression } };
}

/**
 * Returns what a part's lock is kept as among the locked rows.
 *
 * @param part - The part.
 * @returns Its name in the locked list.
 */
export function getPartLock(part: HarmonyPart): string {
  return `part:${part.key}`;
}

/**
 * Says how a progression fills its part: how long it is, and how often it goes round.
 *
 * @param chords - The progression's chords.
 * @param part - The part.
 * @returns The text, like `4 bars, 2 times round in A's 8` or `6 bars: A's 8 do not divide by it`.
 */
export function getProgressionFit(chords: Chord[], part: HarmonyPart): string {
  const bars = getProgressionBars(chords);
  const length = `${writeBars(bars)} ${bars === 1 ? 'bar' : 'bars'}`;
  if (part.bars === null || bars === 0) return `${length}, repeated through the song`;
  const times = part.bars / bars;
  const of = `${part.letter ?? 'the part'}'s ${part.bars}`;
  if (!Number.isInteger(times)) return `${length}: ${of} do not divide by it`;
  return times === 1 ? `${length}, all of ${of}` : `${length}, ${times} times round in ${of}`;
}

/**
 * Returns the harmony to send with a prompt: the parts there are, each with a progression or a
 * variation's ending asked for.
 *
 * @param choice - The harmony.
 * @param parts - The parts there are now.
 * @returns The harmony to send, or null when it asks for nothing.
 */
export function getSentHarmony(choice: HarmonyChoice, parts: HarmonyPart[]): SentHarmony | null {
  const partHarmonies: PartHarmony[] = parts
    .map((part) => ({
      letter: part.letter,
      progression: choice.progressions[part.key] ?? null,
      variation: part.hasVariations ? (choice.variations[part.key] ?? 'same') : 'same',
    }))
    .filter(({ progression, variation }) => progression !== null || variation !== 'same');
  const hasSettings = Object.values(choice.settings).some((value) => value !== null);
  if (!choice.note && !choice.mode && !hasSettings && partHarmonies.length === 0) return null;
  return {
    note: choice.note,
    mode: choice.mode,
    settings: choice.settings,
    strictness: choice.strictness,
    parts: partHarmonies,
  };
}

/**
 * Picks a setting again at random.
 *
 * @param settings - The settings.
 * @param name - The setting.
 * @param getRandom - Gives numbers from 0 up to 1, as Math.random does.
 * @returns The settings, that one picked again.
 */
function rollSetting(
  settings: HarmonySettings,
  name: HarmonySettingName,
  getRandom: () => number,
): HarmonySettings {
  const options: readonly HarmonyOption[] = HARMONY_SETTINGS[name].options;
  return setHarmonySetting(settings, name, pickOne(options, getRandom)?.value ?? null);
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

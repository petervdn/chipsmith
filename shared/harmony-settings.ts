/**
 * The settings of a song's harmony a prompt can ask for, besides its key and its progressions: the
 * kind of chords, their colour, how often they change, the bass, the cadences and a key change; how
 * strictly it is followed; how a variation of a part ends. Each option with how the page shows it
 * and how a prompt asks for it; a setting set to one of its options. Knows nothing of files or the
 * page.
 */
import type { HarmonySettings } from './harmony.types.ts';

/** An option of a setting: its value, how the page shows it, and how a prompt asks for it. */
export type HarmonyOption = { value: string; label: string; ask: string };

/** A setting: its label on the page, and its options. */
export type HarmonySetting = { label: string; options: readonly HarmonyOption[] };

/** The settings' names, in the order the page shows them. */
export const HARMONY_SETTING_NAMES = [
  'chords',
  'colour',
  'rhythm',
  'bass',
  'cadence',
  'keyChange',
] as const;

/** A setting's name. */
export type HarmonySettingName = (typeof HARMONY_SETTING_NAMES)[number];

/** The settings, each with its options. */
export const HARMONY_SETTINGS = {
  chords: {
    label: 'Chords',
    options: [
      { value: 'triads', label: 'triads', ask: 'plain triads' },
      { value: 'sevenths', label: '7ths', ask: 'seventh chords' },
      { value: 'power', label: 'power', ask: 'power chords (root and fifth, no third)' },
    ],
  },
  colour: {
    label: 'Colour',
    options: [
      { value: 'diatonic', label: 'in the mode', ask: 'only chords of the mode' },
      {
        value: 'borrowed',
        label: 'borrowed',
        ask: 'chords of the mode, and some borrowed from the parallel major or minor',
      },
      {
        value: 'chromatic',
        label: 'chromatic',
        ask: 'chromatic colour: borrowed chords, secondary dominants and chromatic mediants',
      },
    ],
  },
  rhythm: {
    label: 'Chord changes',
    options: [
      { value: 'two-bars', label: 'every 2 bars', ask: 'a chord every 2 bars' },
      { value: 'bar', label: 'every bar', ask: 'a chord every bar' },
      { value: 'half-bar', label: 'twice a bar', ask: 'two chords a bar' },
      {
        value: 'varies',
        label: 'varying',
        ask: 'chords changing at varying rates, quicker toward the cadences',
      },
    ],
  },
  bass: {
    label: 'Bass',
    options: [
      { value: 'roots', label: 'roots', ask: "the bass on the chords' roots" },
      {
        value: 'pedal',
        label: 'pedal',
        ask: 'a pedal: the bass holding the key note under the changing chords',
      },
      {
        value: 'walking',
        label: 'walking',
        ask: "a walking bass, stepping between the chords' roots",
      },
      {
        value: 'inversions',
        label: 'inversions',
        ask: 'inversions: the bass moving by step through the chord tones',
      },
    ],
  },
  cadence: {
    label: 'Cadences',
    options: [
      { value: 'resolved', label: 'V–I', ask: 'sections end resolved, dominant to tonic (V–I)' },
      { value: 'half', label: 'on V', ask: 'sections end open on the dominant (V), leading on' },
      { value: 'plagal', label: 'IV–I', ask: 'plagal endings (IV–I or iv–i)' },
      {
        value: 'deceptive',
        label: 'V–vi',
        ask: 'deceptive endings: V going to vi or ♭VI instead of I',
      },
      { value: 'mario', label: '♭VI–♭VII–I', ask: 'the ♭VI–♭VII–I cadence' },
      { value: 'open', label: 'unresolved', ask: 'endings left unresolved, off the tonic' },
    ],
  },
  keyChange: {
    label: 'Key change',
    options: [
      { value: 'none', label: 'none', ask: 'no key change' },
      {
        value: 'last-up-step',
        label: 'last part a step up',
        ask: 'the last section a whole step up',
      },
      {
        value: 'last-up-half',
        label: 'last part a half step up',
        ask: 'the last section a half step up',
      },
      {
        value: 'bridge-relative',
        label: 'B in the relative key',
        ask: 'the contrasting part (B) in the relative major or minor',
      },
      {
        value: 'bridge-fourth',
        label: 'B a fourth up',
        ask: 'the contrasting part (B) in the key a fourth up',
      },
    ],
  },
} as const satisfies Record<HarmonySettingName, HarmonySetting>;

/** A setting's value. */
export type HarmonyValue<Name extends HarmonySettingName> =
  (typeof HARMONY_SETTINGS)[Name]['options'][number]['value'];

/** How strictly a harmony is followed. */
export const STRICTNESSES = [
  {
    value: 'exact',
    label: 'follow exactly',
    ask: 'follow it exactly',
  },
  {
    value: 'loose',
    label: 'a starting point',
    ask: 'take it as a starting point, changing chords where the music asks for it',
  },
] as const satisfies readonly HarmonyOption[];

/** How strictly a harmony is followed. */
export type Strictness = (typeof STRICTNESSES)[number]['value'];

/** How a variation of a part (A′) ends, against the part's own progression. */
export const VARIATION_ENDINGS = [
  { value: 'same', label: 'as the part', ask: 'its progression as it is' },
  { value: 'reharmonised', label: 'last 2 bars reharmonised', ask: 'its last 2 bars reharmonised' },
  { value: 'half-cadence', label: 'ends on V', ask: 'ending on the dominant (V)' },
] as const satisfies readonly HarmonyOption[];

/** How a variation of a part ends. */
export type VariationEnding = (typeof VARIATION_ENDINGS)[number]['value'];

/**
 * Returns a setting's option by its value.
 *
 * @param options - The setting's options.
 * @param value - The value.
 * @returns The option, or undefined for a value that is not one.
 */
export function getHarmonyOption(
  options: readonly HarmonyOption[],
  value: string,
): HarmonyOption | undefined {
  return options.find((option) => option.value === value);
}

/**
 * Sets a setting to one of its options, or to Claude's choice.
 *
 * @param settings - The settings.
 * @param name - The setting.
 * @param value - The option's value; null, or a value that is not one of its options, is Claude's
 *   choice.
 * @returns The settings, that one set.
 */
export function setHarmonySetting(
  settings: HarmonySettings,
  name: HarmonySettingName,
  value: string | null,
): HarmonySettings {
  const { chords, colour, rhythm, bass, cadence, keyChange } = HARMONY_SETTINGS;
  const set = {
    chords: () => ({ ...settings, chords: findValue(chords.options, value) }),
    colour: () => ({ ...settings, colour: findValue(colour.options, value) }),
    rhythm: () => ({ ...settings, rhythm: findValue(rhythm.options, value) }),
    bass: () => ({ ...settings, bass: findValue(bass.options, value) }),
    cadence: () => ({ ...settings, cadence: findValue(cadence.options, value) }),
    keyChange: () => ({ ...settings, keyChange: findValue(keyChange.options, value) }),
  } satisfies Record<HarmonySettingName, () => HarmonySettings>;
  return set[name]();
}

/**
 * Finds the option of a setting that has a value.
 *
 * @param options - The setting's options.
 * @param value - The value looked for, or null.
 * @returns The option's value, typed as the setting's, or null when none has it.
 */
function findValue<Value extends string>(
  options: readonly { value: Value }[],
  value: string | null,
): Value | null {
  return options.find((option) => option.value === value)?.value ?? null;
}

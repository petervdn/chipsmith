/**
 * The progressions offered to hear and keep, written short (progression-notation.ts), each with the
 * modes it is written for (the first its own) and the feels it has: common progressions of songs
 * and game music. Knows nothing of files or the page.
 */
import type { Chord } from './harmony.schema.ts';
import { readProgression } from './progression-notation.ts';

/** A preset: its id, its name, its chords, the modes it fits (its own first) and its feels. */
export type ProgressionPreset = {
  id: string;
  name: string;
  chords: Chord[];
  modes: string[];
  feels: string[];
};

/** The modes that have a minor third and a minor sixth, where the minor progressions sit. */
const MINOR_MODES = ['minor', 'harmonic minor'];

/** The presets, written short. */
const PRESET_NOTATIONS: {
  id: string;
  name: string;
  notation: string;
  modes: string[];
  feels: string[];
}[] = [
  { id: 'pop', name: 'Pop', notation: 'I V vi IV', modes: ['major'], feels: ['bright'] },
  {
    id: 'doo-wop',
    name: 'Doo-wop',
    notation: 'I vi IV V',
    modes: ['major'],
    feels: ['bright', 'bittersweet'],
  },
  {
    id: 'royal-road',
    name: 'Royal road',
    notation: 'IV V iii vi',
    modes: ['major'],
    feels: ['bittersweet'],
  },
  {
    id: 'pachelbel',
    name: 'Canon',
    notation: 'I V vi iii IV I IV V',
    modes: ['major'],
    feels: ['bright', 'heroic'],
  },
  {
    id: 'jazzy',
    name: 'Jazzy turn',
    notation: 'ii7 V7 Imaj7:2',
    modes: ['major'],
    feels: ['dreamy'],
  },
  {
    id: 'mario',
    name: 'Victory',
    notation: 'I IV ♭VI:½ ♭VII:½ I',
    modes: ['major'],
    feels: ['heroic', 'bright'],
  },
  {
    id: 'borrowed-iv',
    name: 'Wistful turn',
    notation: 'I III IV iv',
    modes: ['major'],
    feels: ['bittersweet'],
  },
  {
    id: 'dreamy-major',
    name: 'Daydream',
    notation: 'Imaj7:2 IVmaj7:2',
    modes: ['major', 'lydian'],
    feels: ['dreamy', 'floating'],
  },
  {
    id: 'sus-float',
    name: 'Hover',
    notation: 'Isus2 IVsus2 vi7 Vsus4',
    modes: ['major'],
    feels: ['floating', 'dreamy'],
  },
  {
    id: 'mixolydian-rock',
    name: 'Open road',
    notation: 'I ♭VII IV I',
    modes: ['mixolydian', 'major'],
    feels: ['heroic', 'bright'],
  },
  {
    id: 'mixolydian-sway',
    name: 'Sway',
    notation: 'I:2 ♭VII:2',
    modes: ['mixolydian'],
    feels: ['floating', 'bright'],
  },
  {
    id: 'epic-minor',
    name: 'Epic',
    notation: 'i ♭VI ♭III ♭VII',
    modes: [...MINOR_MODES, 'dorian'],
    feels: ['heroic', 'dark'],
  },
  {
    id: 'andalusian',
    name: 'Descent',
    notation: 'i ♭VII ♭VI V',
    modes: MINOR_MODES,
    feels: ['dark', 'tense'],
  },
  { id: 'dark-loop', name: 'Shadow', notation: 'i ♭VI iv V', modes: MINOR_MODES, feels: ['dark'] },
  {
    id: 'heroic-minor',
    name: 'Quest',
    notation: 'i ♭VII ♭VI ♭VII',
    modes: ['minor'],
    feels: ['heroic'],
  },
  {
    id: 'minor-cadence',
    name: 'Old tale',
    notation: 'i iv V i',
    modes: MINOR_MODES,
    feels: ['dark', 'tense'],
  },
  {
    id: 'minor-jazz',
    name: 'Late night',
    notation: 'iiø7 V7 i:2',
    modes: MINOR_MODES,
    feels: ['bittersweet', 'dreamy'],
  },
  {
    id: 'minor-dreamy',
    name: 'Mist',
    notation: 'i7 iv7 ♭VImaj7 ♭VII',
    modes: ['minor'],
    feels: ['dreamy'],
  },
  {
    id: 'minor-bittersweet',
    name: 'Rainy day',
    notation: 'i ♭III ♭VII IV',
    modes: ['minor', 'dorian'],
    feels: ['bittersweet'],
  },
  {
    id: 'circle',
    name: 'Circle',
    notation: 'i iv ♭VII ♭III ♭VI ii° V i',
    modes: MINOR_MODES,
    feels: ['bittersweet'],
  },
  {
    id: 'harmonic-tense',
    name: 'Danger',
    notation: 'i ♭VI ii° V',
    modes: ['harmonic minor', 'minor'],
    feels: ['tense', 'dark'],
  },
  {
    id: 'diminished-pull',
    name: 'Creep',
    notation: 'i:2 vii°7:2',
    modes: ['harmonic minor'],
    feels: ['tense'],
  },
  {
    id: 'dorian-vamp',
    name: 'Groove',
    notation: 'i:2 IV:2',
    modes: ['dorian'],
    feels: ['floating', 'bittersweet'],
  },
  {
    id: 'dorian-bright',
    name: 'Sunny minor',
    notation: 'i ii ♭III IV',
    modes: ['dorian'],
    feels: ['bright'],
  },
  {
    id: 'phrygian-pulse',
    name: 'Pulse',
    notation: 'i ♭II i ♭vii',
    modes: ['phrygian'],
    feels: ['dark', 'tense'],
  },
  {
    id: 'phrygian-march',
    name: 'Fortress',
    notation: 'i ♭II ♭III ♭II',
    modes: ['phrygian'],
    feels: ['heroic', 'dark'],
  },
  {
    id: 'phrygian-descent',
    name: 'Ritual',
    notation: 'i ♭vii ♭VI ♭II',
    modes: ['phrygian'],
    feels: ['dark', 'tense'],
  },
  {
    id: 'lydian-float',
    name: 'Starlight',
    notation: 'I:2 II:2',
    modes: ['lydian'],
    feels: ['dreamy', 'floating'],
  },
  {
    id: 'lydian-bright',
    name: 'Skyward',
    notation: 'I II vii I',
    modes: ['lydian'],
    feels: ['bright'],
  },
  {
    id: 'flamenco',
    name: 'Flamenco',
    notation: 'iv ♭III ♭II I',
    modes: ['phrygian dominant'],
    feels: ['dark', 'tense'],
  },
  {
    id: 'phrygian-vamp',
    name: 'Desert',
    notation: 'I:2 ♭II:2',
    modes: ['phrygian dominant'],
    feels: ['tense', 'floating'],
  },
  {
    id: 'twelve-bar',
    name: '12-bar blues',
    notation: 'I7 IV7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7',
    modes: ['blues', 'mixolydian', 'major'],
    feels: ['bright'],
  },
  {
    id: 'eight-bar',
    name: '8-bar blues',
    notation: 'I7 V7 IV7 IV7 I7 V7 I7 V7',
    modes: ['blues', 'mixolydian'],
    feels: ['bright', 'bittersweet'],
  },
];

/** Every preset, in the order they are offered. */
export const PROGRESSION_PRESETS: ProgressionPreset[] = PRESET_NOTATIONS.map(
  ({ id, name, notation, modes, feels }) => {
    const { chords, error } = readProgression(notation);
    if (!chords) throw new Error(`the progression ${id} does not read: ${error}`);
    return { id, name, chords, modes, feels };
  },
);

/**
 * Returns the presets to hear for a scale and a feel: those that fit both, else those of the scale,
 * else all of them.
 *
 * @param mode - The mode, or null for any.
 * @param feel - The feel, or null for any.
 * @returns The presets, in the order they are offered.
 */
export function getPresetsFor(mode: string | null, feel: string | null): ProgressionPreset[] {
  const ofMode = PROGRESSION_PRESETS.filter(
    (preset) => mode === null || preset.modes.includes(mode),
  );
  const ofBoth = ofMode.filter((preset) => feel === null || preset.feels.includes(feel));
  if (ofBoth.length > 0) return ofBoth;
  return ofMode.length > 0 ? ofMode : PROGRESSION_PRESETS;
}

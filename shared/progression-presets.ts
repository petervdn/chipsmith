/**
 * The progressions a part can start from, written short (progression-notation.ts), each with the
 * modes it is offered in: common progressions of songs and game music. Knows nothing of files or
 * the page.
 */
import type { Chord } from './harmony.types.ts';
import { readProgression } from './progression-notation.ts';

/** A preset: its id, its name, its chords and the modes it is offered in. */
export type ProgressionPreset = { id: string; name: string; chords: Chord[]; modes: string[] };

/** The modes that have a minor third and a minor sixth, where the minor progressions sit. */
const MINOR_MODES = ['minor', 'harmonic minor'];

/** The presets, written short. */
const PRESET_NOTATIONS: { id: string; name: string; notation: string; modes: string[] }[] = [
  { id: 'pop', name: 'pop (I–V–vi–IV)', notation: 'I V vi IV', modes: ['major'] },
  { id: 'doo-wop', name: 'doo-wop', notation: 'I vi IV V', modes: ['major'] },
  { id: 'royal-road', name: 'royal road', notation: 'IV V iii vi', modes: ['major'] },
  { id: 'pachelbel', name: 'Pachelbel', notation: 'I V vi iii IV I IV V', modes: ['major'] },
  { id: 'two-five-one', name: 'ii–V–I', notation: 'ii7 V7 Imaj7:2', modes: ['major'] },
  { id: 'mario', name: 'Mario cadence', notation: 'I IV ♭VI:½ ♭VII:½ I', modes: ['major'] },
  { id: 'borrowed-iv', name: 'borrowed iv', notation: 'I III IV iv', modes: ['major'] },
  {
    id: 'mixolydian-rock',
    name: 'mixolydian rock',
    notation: 'I ♭VII IV I',
    modes: ['mixolydian', 'major'],
  },
  {
    id: 'epic-minor',
    name: 'epic minor',
    notation: 'i ♭VI ♭III ♭VII',
    modes: [...MINOR_MODES, 'dorian'],
  },
  { id: 'andalusian', name: 'Andalusian', notation: 'i ♭VII ♭VI V', modes: MINOR_MODES },
  { id: 'dark-loop', name: 'dark loop', notation: 'i ♭VI iv V', modes: MINOR_MODES },
  { id: 'heroic-minor', name: 'heroic minor', notation: 'i ♭VII ♭VI ♭VII', modes: ['minor'] },
  { id: 'minor-cadence', name: 'i–iv–V–i', notation: 'i iv V i', modes: MINOR_MODES },
  { id: 'minor-two-five', name: 'minor ii–V–i', notation: 'iiø7 V7 i:2', modes: MINOR_MODES },
  {
    id: 'circle',
    name: 'circle of fifths',
    notation: 'i iv ♭VII ♭III ♭VI ii° V i',
    modes: MINOR_MODES,
  },
  { id: 'dorian-vamp', name: 'dorian vamp', notation: 'i:2 IV:2', modes: ['dorian'] },
  { id: 'dorian-groove', name: 'dorian groove', notation: 'i ♭III ♭VII IV', modes: ['dorian'] },
  { id: 'phrygian-pulse', name: 'phrygian pulse', notation: 'i ♭II i ♭vii', modes: ['phrygian'] },
  { id: 'lydian-float', name: 'lydian float', notation: 'I:2 II:2', modes: ['lydian'] },
  {
    id: 'flamenco',
    name: 'flamenco descent',
    notation: 'iv ♭III ♭II I',
    modes: ['phrygian dominant'],
  },
  {
    id: 'phrygian-vamp',
    name: 'phrygian vamp',
    notation: 'I:2 ♭II:2',
    modes: ['phrygian dominant'],
  },
  {
    id: 'twelve-bar',
    name: '12-bar blues',
    notation: 'I7 IV7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7',
    modes: ['blues', 'mixolydian', 'major'],
  },
  {
    id: 'eight-bar',
    name: '8-bar blues',
    notation: 'I7 V7 IV7 IV7 I7 V7 I7 V7',
    modes: ['blues', 'mixolydian'],
  },
];

/** Every preset, in the order they are offered. */
export const PROGRESSION_PRESETS: ProgressionPreset[] = PRESET_NOTATIONS.map(
  ({ id, name, notation, modes }) => {
    const { chords, error } = readProgression(notation);
    if (!chords) throw new Error(`the progression ${id} does not read: ${error}`);
    return { id, name, chords, modes };
  },
);

/**
 * Returns the presets offered in a mode.
 *
 * @param mode - The mode's name, or null for any: then every preset.
 * @returns The presets, in the order they are offered.
 */
export function getModePresets(mode: string | null): ProgressionPreset[] {
  return PROGRESSION_PRESETS.filter((preset) => mode === null || preset.modes.includes(mode));
}

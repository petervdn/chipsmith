/**
 * The chips a reference song may play on, by the names Furnace's text export gives them: the NES
 * with its Famicom expansions, the SID and the SCC (with the PSG, the AY-3-8910 an MSX has beside it), and a
 * plain PCM DAC. For each: a short label, its channels' names in Furnace's order, and which of the
 * app's chips it belongs with. Knows nothing of files.
 */
import type { ChipFamily } from '../shared/reference.schema.ts';

/** A chip a reference may play on. */
type DemoChip = { label: string; family: ChipFamily | null; channels: string[] };

/**
 * Returns numbered names: `Voice 1`, `Voice 2`…
 *
 * @param name - The name before the number.
 * @param count - How many.
 * @returns The names.
 */
function getNumbered(name: string, count: number): string[] {
  return Array.from({ length: count }, (_unused, i) => `${name} ${i + 1}`);
}

/** The chips, by Furnace's names. */
const DEMO_CHIPS = {
  'NES (Ricoh 2A03)': {
    label: 'NES',
    family: 'nes',
    channels: ['Pulse 1', 'Pulse 2', 'Triangle', 'Noise', 'DPCM'],
  },
  'Konami VRC6': {
    label: 'VRC6',
    family: null,
    channels: ['VRC6 Pulse 1', 'VRC6 Pulse 2', 'VRC6 Saw'],
  },
  'Konami VRC7': { label: 'VRC7', family: null, channels: getNumbered('VRC7 FM', 6) },
  'Famicom Disk System (chip)': { label: 'FDS', family: null, channels: ['FDS'] },
  'Namco 163': { label: 'N163', family: null, channels: getNumbered('N163', 8) },
  MMC5: { label: 'MMC5', family: null, channels: ['MMC5 Pulse 1', 'MMC5 Pulse 2', 'MMC5 PCM'] },
  'Commodore 64 (SID 6581)': {
    label: 'SID 6581',
    family: 'sid',
    channels: getNumbered('Voice', 3),
  },
  'Commodore 64 (SID 8580)': {
    label: 'SID 8580',
    family: 'sid',
    channels: getNumbered('Voice', 3),
  },
  'Konami SCC': { label: 'SCC', family: 'scc', channels: getNumbered('SCC', 5) },
  'Konami SCC+': { label: 'SCC+', family: 'scc', channels: getNumbered('SCC+', 5) },
  'AY-3-8910': { label: 'PSG', family: null, channels: getNumbered('PSG', 3) },
  'Generic PCM DAC': { label: 'PCM DAC', family: null, channels: ['PCM'] },
} satisfies Record<string, DemoChip>;

/** The chips by name, to look a name read from a file up in. */
const CHIPS_BY_NAME = new Map<string, DemoChip>(Object.entries(DEMO_CHIPS));

/** The families in the order a reference is listed under the first it has. */
const FAMILIES: ChipFamily[] = ['nes', 'sid', 'scc'];

/**
 * Returns the names of a reference's channels, in order. A chip that comes more than once gets its
 * number after each of its channels' names (`Voice 1 (SID 8580 2)`).
 *
 * @param chips - Its chips, by Furnace's names, in order.
 * @returns The names, or null when a chip is not one a reference may play on.
 */
export function getChannelNames(chips: string[]): string[] | null {
  const known = chips.map((name) => CHIPS_BY_NAME.get(name));
  if (known.some((chip) => !chip)) return null;
  const names: string[] = [];
  known.forEach((chip, i) => {
    if (!chip) return;
    const count = chips.filter((name) => name === chips[i]).length;
    const number = chips.slice(0, i + 1).filter((name) => name === chips[i]).length;
    const suffix = count > 1 ? ` (${chip.label} ${number})` : '';
    names.push(...chip.channels.map((channel) => `${channel}${suffix}`));
  });
  return names;
}

/**
 * Returns the short labels of a reference's chips (`NES`, `VRC6`), a name not known as it is.
 *
 * @param chips - Its chips, by Furnace's names.
 * @returns The labels, in order.
 */
export function getChipLabels(chips: string[]): string[] {
  return chips.map((name) => CHIPS_BY_NAME.get(name)?.label ?? name);
}

/**
 * Returns which of the app's chips a reference is listed under: the first of NES, SID and SCC it
 * plays on.
 *
 * @param chips - Its chips, by Furnace's names.
 * @returns The family, or null when it plays on none of them.
 */
export function getChipFamily(chips: string[]): ChipFamily | null {
  const families = new Set(chips.map((name) => CHIPS_BY_NAME.get(name)?.family ?? null));
  return FAMILIES.find((family) => families.has(family)) ?? null;
}

/**
 * The chips: those a song can be made for, by the names a song's script and the prompt builder use,
 * and every chip Furnace id this project reads, with its name as a clip records it and the names of
 * its channels. The one place a chip is described; knows nothing of files or the page.
 */

const SCC_CHANNELS = ['SCC 1', 'SCC 2', 'SCC 3', 'SCC 4', 'SCC 5'];
const SID_CHANNELS = ['SID 1', 'SID 2', 'SID 3'];
const PSG_CHANNELS = ['PSG 1', 'PSG 2', 'PSG 3'];

/** A chip as Furnace has it: its id, its name (as a clip records it) and its channels' names. */
export type FurnaceChip = { id: number; name: string; channelNames: string[] };

/** Every chip this project reads, by its Furnace id. */
export const FURNACE_CHIPS: FurnaceChip[] = [
  { id: 0x06, name: 'NES', channelNames: ['Pulse 1', 'Pulse 2', 'Triangle', 'Noise', 'DPCM'] },
  { id: 0x80, name: 'PSG', channelNames: PSG_CHANNELS },
  { id: 0xb4, name: 'SCC+', channelNames: SCC_CHANNELS },
  { id: 0xa1, name: 'SCC', channelNames: SCC_CHANNELS },
  { id: 0x47, name: 'SID', channelNames: SID_CHANNELS },
  { id: 0x07, name: 'SID 8580', channelNames: SID_CHANNELS },
];

/** The chips a song can be made for, in the order their channels come in a song. */
export const CHIP_NAMES = ['nes', 'psg', 'scc', 'sid'] as const;

/** A chip a song can be made for. */
export type ChipName = (typeof CHIP_NAMES)[number];

/**
 * How each chip a song can be made for is named in words, and the Furnace chip it is written as:
 * the PSG as the AY-3-8910 every MSX has, the SCC as the SCC+ (five independent channels), the SID
 * as the 6581 (the first C64's).
 */
export const CHIPS = {
  nes: { label: 'NES', furnaceId: 0x06 },
  psg: { label: 'PSG', furnaceId: 0x80 },
  scc: { label: 'SCC', furnaceId: 0xb4 },
  sid: { label: 'SID', furnaceId: 0x47 },
} satisfies Record<ChipName, { label: string; furnaceId: number }>;

/**
 * Returns a chip Furnace id this project reads.
 *
 * @param id - Furnace's id of the chip.
 * @returns The chip, or undefined for one not read.
 */
export function getFurnaceChip(id: number): FurnaceChip | undefined {
  return FURNACE_CHIPS.find((chip) => chip.id === id);
}

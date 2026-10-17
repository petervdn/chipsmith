/**
 * The chips a song can be made for, by the names a song's script and the prompt builder use, in the
 * order their channels come in a song. Knows nothing of Furnace's ids (make/fur-file-builder.ts).
 */

/** The chips, in the order their channels come in a song. */
export const CHIP_NAMES = ['nes', 'scc'] as const;

/** A chip a song can be made for. */
export type ChipName = (typeof CHIP_NAMES)[number];

/** How each chip is named in words. */
export const CHIP_LABELS = { nes: 'NES', scc: 'SCC' } satisfies Record<ChipName, string>;

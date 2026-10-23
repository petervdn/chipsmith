/**
 * A .fur file without its slides: the effects that bend a note's pitch over time taken out of every
 * row (01 pitch up, 02 pitch down, 03 portamento, E1 and E2 note slides up and down). Notes,
 * instruments, volumes and every other effect stay; a row left with nothing is empty. A chip's own
 * sweeps (the NES pulse's 13 and 14) and pitch macros are not touched. Knows nothing of clips.
 */
import type { FurFile, Row } from './fur.types.ts';

/** The effect codes that slide a note's pitch. */
const SLIDE_CODES = new Set([0x01, 0x02, 0x03, 0xe1, 0xe2]);

/**
 * Returns how many slide effects a .fur file has.
 *
 * @param furFile - The .fur file.
 * @returns The number of slide effects in its rows.
 */
export function getSlideCount(furFile: FurFile): number {
  return furFile.patterns
    .flatMap((pattern) => pattern.rows)
    .flatMap((row) => row?.effects ?? [])
    .filter((effect) => effect.code !== null && SLIDE_CODES.has(effect.code)).length;
}

/**
 * Returns a .fur file with every slide effect taken out.
 *
 * @param furFile - The .fur file; it is left as it was.
 * @returns The .fur file without slides.
 */
export function removeSlides(furFile: FurFile): FurFile {
  return {
    ...furFile,
    patterns: furFile.patterns.map((pattern) => ({
      ...pattern,
      rows: pattern.rows.map((row) => (row ? getRowWithoutSlides(row) : row)),
    })),
  };
}

/**
 * Returns a row without its slide effects, or null when nothing is left in it.
 *
 * @param row - The row.
 * @returns The row without slides, or null.
 */
function getRowWithoutSlides(row: Row): Row | null {
  if (!row.effects) return row;
  const effects = row.effects.filter(
    (effect) => effect.code === null || !SLIDE_CODES.has(effect.code),
  );
  const { effects: _old, ...rest } = row;
  const kept: Row = effects.length > 0 ? { ...rest, effects } : rest;
  return Object.keys(kept).length > 0 ? kept : null;
}

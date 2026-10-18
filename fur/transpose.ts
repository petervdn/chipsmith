/**
 * A .fur file transposed: the notes of some of its channels moved by semitones, note offs and
 * releases left as they are. A note moved past what Furnace can play is an error, not clamped, so a
 * line keeps its shape. Instruments, effects and macros are not touched (an arpeggio or a fixed-note
 * macro stays as it is). Knows nothing of clips.
 */
import type { FurFile, Row } from './fur.types.ts';
import { NOTE_OFF, getNoteName } from './notes.ts';

/**
 * Returns a .fur file with the notes of some channels moved by semitones.
 *
 * @param furFile - The .fur file; it is left as it was.
 * @param semitones - How far to move them, up or down.
 * @param channels - The channels whose notes move.
 * @returns The transposed .fur file; an error when a note would go past what Furnace plays.
 */
export function transposeFurFile(furFile: FurFile, semitones: number, channels: number[]): FurFile {
  const moved = new Set(channels);
  const patterns = furFile.patterns.map((pattern) =>
    moved.has(pattern.channel)
      ? {
          ...pattern,
          rows: pattern.rows.map((row) =>
            row ? transposeRow(row, semitones, pattern.channel) : row,
          ),
        }
      : pattern,
  );
  return { ...furFile, patterns };
}

function transposeRow(row: Row, semitones: number, channel: number): Row {
  if (row.note === undefined || row.note >= NOTE_OFF) return row;
  const note = row.note + semitones;
  if (note < 0 || note >= NOTE_OFF) {
    throw new Error(
      `${getNoteName(row.note)} on channel ${channel + 1} would go past the notes Furnace plays`,
    );
  }
  return { ...row, note };
}

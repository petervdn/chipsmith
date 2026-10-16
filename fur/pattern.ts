/**
 * A pattern's rows, packed as Furnace packs them (PATN block) and unpacked again: a mask byte for
 * what a row holds, runs of empty rows as one byte, effects by a mask of their columns.
 */
import { ByteReader, ByteWriter } from './bytes.ts';
import { makeBlock } from './block.ts';
import type { Effect, Row } from './fur.types.ts';

/** The most empty rows one byte can skip. */
const MOST_SKIPPED = 129;
/** The end of a pattern's rows. */
const END = 0xff;

/** A PATN block of the first subsong. */
export function makePattern(channel: number, index: number, rows: (Row | null)[]): Uint8Array {
  const body = new ByteWriter().u8(0).u8(channel).u16(index).u8(0);
  body.add(packRows(rows));
  return makeBlock('PATN', body.getBytes());
}

/** Rows packed: a mask byte per row that holds something, empty rows skipped in runs. */
export function packRows(rows: (Row | null)[]): Uint8Array {
  const writer = new ByteWriter();
  let empty = 0;
  function skipEmpty(): void {
    while (empty > 0) {
      if (empty === 1) {
        writer.u8(0);
        empty = 0;
      } else {
        const count = Math.min(empty, MOST_SKIPPED);
        writer.u8(0x80 | (count - 2));
        empty -= count;
      }
    }
  }
  for (const row of rows) {
    if (!row || isEmptyRow(row)) {
      empty += 1;
      continue;
    }
    skipEmpty();
    addRow(writer, row);
  }
  writer.u8(END);
  return writer.getBytes();
}

/** Rows unpacked from a reader at their start, `length` of them. */
export function unpackRows(reader: ByteReader, length: number): (Row | null)[] {
  const rows: (Row | null)[] = Array.from({ length }, () => null);
  let index = 0;
  while (index < length) {
    const mask = reader.u8();
    if (mask === END) break;
    if (mask & 0x80) {
      index += (mask & 0x7f) + 2;
      continue;
    }
    if (mask === 0) {
      index += 1;
      continue;
    }
    let effectMask = 0;
    if (mask & 8) effectMask |= 1;
    if (mask & 16) effectMask |= 2;
    if (mask & 32) effectMask = reader.u8();
    if (mask & 64) effectMask |= reader.u8() << 8;
    const row: Row = {};
    if (mask & 1) row.note = reader.u8();
    if (mask & 2) row.instrument = reader.u8();
    if (mask & 4) row.volume = reader.u8();
    const effects: Effect[] = [];
    for (let column = 0; column < 8; column++) {
      const code = effectMask & (1 << (2 * column)) ? reader.u8() : null;
      const value = effectMask & (2 << (2 * column)) ? reader.u8() : null;
      if (code !== null || value !== null) effects.push({ code, value });
    }
    if (effects.length > 0) row.effects = effects;
    rows[index] = row;
    index += 1;
  }
  return rows;
}

function addRow(writer: ByteWriter, { note, instrument, volume, effects = [] }: Row): void {
  let effectMask = 0;
  effects.forEach(({ code, value }, column) => {
    if (code !== null) effectMask |= 1 << (2 * column);
    if (value !== null) effectMask |= 2 << (2 * column);
  });
  let mask =
    (note === undefined ? 0 : 1) |
    (instrument === undefined ? 0 : 2) |
    (volume === undefined ? 0 : 4);
  const extra: number[] = [];
  if (effectMask & ~3) {
    mask |= 32;
    extra.push(effectMask & 0xff);
    if (effectMask >> 8) {
      mask |= 64;
      extra.push(effectMask >> 8);
    }
  } else {
    mask |= (effectMask & 3) << 3;
  }
  writer.u8(mask).add(extra);
  for (const field of [note, instrument, volume]) if (field !== undefined) writer.u8(field);
  for (const { code, value } of effects) {
    if (code !== null) writer.u8(code);
    if (value !== null) writer.u8(value);
  }
}

/** A row with nothing in it, which is written as an empty row. */
function isEmptyRow({ note, instrument, volume, effects = [] }: Row): boolean {
  return note === undefined && instrument === undefined && volume === undefined && !effects.length;
}

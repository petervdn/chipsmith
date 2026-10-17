/** A block of a .fur file: four letters, its length, its body; and the format version written. */
import { ByteWriter } from './bytes.ts';

/** The format version this project writes: Furnace 0.6.8's. */
export const FORMAT_VERSION = 223;

/**
 * Returns a block of a .fur file: its id, its body's length as a 32-bit number, then its body.
 *
 * @param id - The block's four-letter id, such as "INS2".
 * @param body - The block's body.
 * @returns The block's bytes.
 */
export function makeBlock(id: string, body: Uint8Array): Uint8Array {
  return new ByteWriter().ascii(id).u32(body.length).add(body).getBytes();
}

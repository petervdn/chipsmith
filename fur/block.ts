/** A block of a .fur file: four letters, its length, its body; and the format version written. */
import { ByteWriter } from './bytes.ts';

/** The format version this project writes: Furnace 0.6.8's. */
export const FORMAT_VERSION = 223;

/** A block: its id, its body's length and its body. */
export function makeBlock(id: string, body: Uint8Array): Uint8Array {
  return new ByteWriter().ascii(id).u32(body.length).add(body).getBytes();
}

/**
 * What a WAV file says of itself: its sample rate, channels, bits and length. Read from its header,
 * for the clip's length. Knows nothing of Furnace.
 */
import { ByteReader } from '../fur/bytes.ts';

/** A WAV's format and length. */
export type WavFacts = { sampleRate: number; channels: number; bits: number; seconds: number };

/**
 * Returns the highest sample of a 16-bit WAV. Throws for any other bit depth.
 *
 * @param bytes - The whole WAV file.
 * @returns The highest sample's size, from 0 to 1 of full scale.
 */
export function getWavPeak(bytes: Uint8Array): number {
  const { bits } = getWavFacts(bytes);
  if (bits !== 16) throw new Error(`peak of a ${bits}-bit WAV is not read`);
  const start = findDataStart(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset + start, bytes.byteLength - start);
  let peak = 0;
  for (let offset = 0; offset + 1 < view.byteLength; offset += 2) {
    peak = Math.max(peak, Math.abs(view.getInt16(offset, true)));
  }
  return peak / 32768;
}

/**
 * Reads the facts of a WAV from its header. Throws if the bytes are not a WAV, or have no data
 * chunk or none after the format chunk.
 *
 * @param bytes - The WAV file, at least up to its data chunk's header.
 * @returns Its sample rate, channels, bits and length in seconds.
 */
export function getWavFacts(bytes: Uint8Array): WavFacts {
  const reader = new ByteReader(bytes);
  if (reader.ascii(4) !== 'RIFF') throw new Error('not a WAV: no RIFF');
  reader.u32();
  if (reader.ascii(4) !== 'WAVE') throw new Error('not a WAV: no WAVE');
  let format: Omit<WavFacts, 'seconds'> | null = null;
  while (reader.position + 8 <= bytes.length) {
    const id = reader.ascii(4);
    const size = reader.u32();
    if (id === 'fmt ') {
      const start = reader.position;
      reader.u16();
      const channels = reader.u16();
      const sampleRate = reader.u32();
      reader.u32();
      reader.u16();
      const bits = reader.u16();
      format = { sampleRate, channels, bits };
      reader.position = start + size;
    } else if (id === 'data') {
      if (!format) throw new Error('not a WAV: data before fmt');
      const bytesPerFrame = (format.bits / 8) * format.channels;
      return { ...format, seconds: size / bytesPerFrame / format.sampleRate };
    } else {
      reader.position += size + (size % 2);
    }
  }
  throw new Error('not a WAV: no data chunk');
}

/**
 * Finds where a WAV's sample data starts: after the header of its data chunk. Throws if there is no
 * data chunk.
 *
 * @param bytes - The whole WAV file.
 * @returns The position of the first sample byte.
 */
function findDataStart(bytes: Uint8Array): number {
  const reader = new ByteReader(bytes, 12);
  while (reader.position + 8 <= bytes.length) {
    const id = reader.ascii(4);
    const size = reader.u32();
    if (id === 'data') return reader.position;
    reader.position += size + (size % 2);
  }
  throw new Error('not a WAV: no data chunk');
}

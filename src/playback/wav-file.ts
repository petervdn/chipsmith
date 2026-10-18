/**
 * A rendered mix written as a 16-bit WAV file, and its peak. Given the channels' samples, gives
 * bytes; knows no audio context and no page.
 */

/** The bytes of a WAV's header before its samples: RIFF, the format chunk and the data chunk's head. */
const HEADER_LENGTH = 44;
/** The largest 16-bit sample. */
const LOUDEST_SAMPLE = 32767;
/** Bytes to a 16-bit sample. */
const SAMPLE_BYTES = 2;
/** The format chunk's size, for PCM. */
const FORMAT_CHUNK_LENGTH = 16;
/** The format chunk's code for PCM. */
const PCM_FORMAT = 1;

/**
 * Returns a mix's samples as a 16-bit PCM WAV file, the channels interleaved. A sample past full
 * scale is clipped to it.
 *
 * @param channels - Each channel's samples, -1 to 1, all of the same length.
 * @param sampleRate - Samples a second.
 * @returns The WAV file's bytes.
 */
export function getWavBytes(channels: Float32Array[], sampleRate: number): Uint8Array<ArrayBuffer> {
  const frames = channels[0]?.length ?? 0;
  const dataLength = frames * channels.length * SAMPLE_BYTES;
  const bytes = new Uint8Array(HEADER_LENGTH + dataLength);
  const view = new DataView(bytes.buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, HEADER_LENGTH - 8 + dataLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, FORMAT_CHUNK_LENGTH, true);
  view.setUint16(20, PCM_FORMAT, true);
  view.setUint16(22, channels.length, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels.length * SAMPLE_BYTES, true);
  view.setUint16(32, channels.length * SAMPLE_BYTES, true);
  view.setUint16(34, SAMPLE_BYTES * 8, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  let offset = HEADER_LENGTH;
  for (let frame = 0; frame < frames; frame++) {
    for (const channel of channels) {
      const sample = Math.max(-1, Math.min(1, channel[frame] ?? 0));
      view.setInt16(offset, Math.round(sample * LOUDEST_SAMPLE), true);
      offset += SAMPLE_BYTES;
    }
  }
  return bytes;
}

/**
 * Returns the loudest sample of a mix.
 *
 * @param channels - Each channel's samples.
 * @returns The loudest sample's size; over 1 when it goes past full scale.
 */
export function getPeak(channels: Float32Array[]): number {
  let peak = 0;
  for (const channel of channels) {
    for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  }
  return peak;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

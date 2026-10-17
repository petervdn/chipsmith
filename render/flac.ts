/**
 * Encoding a WAV as FLAC, with ffmpeg (docs/adr/0007), and reading a FLAC's length from its header.
 * Knows nothing of Furnace.
 */
import { spawn } from 'node:child_process';
import { closeSync, openSync, readSync } from 'node:fs';
import { getSettings } from '../config/settings.ts';

/**
 * Writes a WAV's audio as a FLAC file with ffmpeg. Fails rather than replace a file that is there.
 *
 * @param wavFile - The path of the WAV to read.
 * @param flacFile - The path of the FLAC to write; it need not end in .flac.
 */
export function encodeFlac(wavFile: string, flacFile: string): Promise<void> {
  const args = [
    '-v',
    'error',
    '-n',
    '-i',
    wavFile,
    '-c:a',
    'flac',
    '-compression_level',
    '8',
    // named, as the file it writes may not end in .flac
    '-f',
    'flac',
    flacFile,
  ];
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getSettings().ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '';
    ffmpeg.stderr.on('data', (chunk: Buffer) => {
      errors += chunk.toString();
    });
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${errors.trim()}`));
    });
  });
}

/** The bytes of a FLAC file's start that hold its length: the marker, a block header, STREAMINFO. */
const FLAC_HEADER_LENGTH = 26;

/**
 * Returns a FLAC's length from the start of its bytes: its STREAMINFO's samples and sample rate.
 *
 * @param header - The file's first 26 bytes or more.
 * @returns Its length in seconds, or null when the bytes are not a FLAC's or do not say.
 */
export function getFlacSeconds(header: Uint8Array): number | null {
  if (header.length < FLAC_HEADER_LENGTH) return null;
  if (String.fromCharCode(...header.subarray(0, 4)) !== 'fLaC') return null;
  const [rate1 = 0, rate2 = 0, rate3 = 0, samples1 = 0, samples2 = 0, samples3 = 0] =
    header.subarray(18, 24);
  const [samples4 = 0, samples5 = 0] = header.subarray(24, 26);
  const sampleRate = (rate1 << 12) | (rate2 << 4) | (rate3 >> 4);
  const samples =
    (samples1 & 0x0f) * 2 ** 32 +
    ((samples2 << 24) >>> 0) +
    (samples3 << 16) +
    (samples4 << 8) +
    samples5;
  return sampleRate > 0 && samples > 0 ? samples / sampleRate : null;
}

/**
 * Reads a FLAC file's length from its header.
 *
 * @param flacFile - The path of the FLAC.
 * @returns Its length in seconds, or null when it cannot be read or does not say.
 */
export function readFlacSeconds(flacFile: string): number | null {
  try {
    const file = openSync(flacFile, 'r');
    try {
      const header = new Uint8Array(FLAC_HEADER_LENGTH);
      readSync(file, header, 0, FLAC_HEADER_LENGTH, 0);
      return getFlacSeconds(header);
    } finally {
      closeSync(file);
    }
  } catch {
    return null;
  }
}

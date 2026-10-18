/**
 * A song's mix, as the page rendered it to a WAV, encoded to another export file type with ffmpeg,
 * through files in a folder of the system's temporary folder that is removed after. Knows nothing of
 * songs or the page.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ExportFormat } from '../shared/audio-export.ts';
import { runFfmpeg } from './ffmpeg.ts';

/**
 * Encodes a WAV to an export file type. A file, not a pipe, is written, so ffmpeg can go back and
 * write the length into the file's header (FLAC's STREAMINFO).
 *
 * @param wav - The WAV file's bytes.
 * @param format - The file type to encode it to; not WAV.
 * @returns The encoded file's bytes.
 */
export async function encodeExport(wav: Uint8Array, format: ExportFormat): Promise<Buffer> {
  const folder = mkdtempSync(join(tmpdir(), 'chipsmith-export-'));
  try {
    const wavFile = join(folder, 'mix.wav');
    const encodedFile = join(folder, `mix.${format.extension}`);
    writeFileSync(wavFile, wav);
    await runFfmpeg(['-v', 'error', '-i', wavFile, ...format.ffmpegArgs, encodedFile]);
    return readFileSync(encodedFile);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

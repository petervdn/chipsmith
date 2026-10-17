/** Encoding a WAV as FLAC, with ffmpeg (docs/adr/0007). Knows nothing of Furnace. */
import { spawn } from 'node:child_process';
import { getSettings } from '../config/settings.ts';

/** Writes a WAV's audio as a FLAC file; fails rather than replace one that is there. */
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

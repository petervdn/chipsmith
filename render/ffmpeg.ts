/**
 * Running ffmpeg (the one in the settings) with arguments, failing with what it wrote to stderr.
 * Knows nothing of what it encodes.
 */
import { spawn } from 'node:child_process';
import { getSettings } from '../config/settings.ts';

/**
 * Runs ffmpeg and waits for it to end.
 *
 * @param args - Its arguments.
 */
export function runFfmpeg(args: string[]): Promise<void> {
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

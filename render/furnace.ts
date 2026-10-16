/**
 * Rendering a .fur to a WAV with the Furnace app's command line. Furnace opens a CoreMIDI client every
 * time it starts, which macOS refuses after many quick launches: renders run one at a time, with a
 * pause between one exit and the next start, and a failed render is tried again (docs/later.md).
 */
import { spawn } from 'node:child_process';

/** The Furnace binary; CHIPTUNE_FURNACE points elsewhere. */
export const FURNACE =
  process.env['CHIPTUNE_FURNACE'] ?? '/Applications/Furnace.app/Contents/MacOS/Furnace';
/** The Furnace version renders are made with, as clip.json records it. */
export const FURNACE_VERSION = '0.6.8.3';
/** Milliseconds from one Furnace exit to the next start. */
const PAUSE = 1000;
/** Tries before a render is given up. */
const TRIES = 3;

let lastExit = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Renders a .fur once through (no loop) to a WAV file; renders wait for each other. */
export function renderToWav(furFile: string, wavFile: string): Promise<void> {
  const render = queue.then(() => renderWithRetries(furFile, wavFile));
  queue = render.catch(() => undefined);
  return render;
}

async function renderWithRetries(furFile: string, wavFile: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    await wait(Math.max(0, lastExit + PAUSE * attempt - Date.now()));
    try {
      await runFurnace([
        '-loglevel',
        'error',
        '-nostatus',
        '-loops',
        '0',
        '-output',
        wavFile,
        furFile,
      ]);
      return;
    } catch (error) {
      lastError = error;
    } finally {
      lastExit = Date.now();
    }
  }
  throw new Error(`Furnace failed ${TRIES} times on ${furFile}: ${String(lastError)}`);
}

function runFurnace(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const furnace = spawn(FURNACE, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '';
    furnace.stderr.on('data', (chunk: Buffer) => {
      errors = (errors + chunk.toString()).slice(-2000);
    });
    furnace.on('error', reject);
    furnace.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`exit ${code}: ${errors.trim()}`));
    });
  });
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

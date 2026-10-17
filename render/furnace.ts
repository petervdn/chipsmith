/**
 * Rendering a .fur to a WAV with the Furnace app's command line. Furnace opens a CoreMIDI client every
 * time it starts, which macOS has refused after many quick launches: renders run one at a time, and a
 * failed render is tried again after a pause that grows (docs/adr/0015, docs/later.md). 75 renders
 * back to back without a pause all worked (2026-10-17).
 */
import { spawn } from 'node:child_process';
import { getSettings } from '../config/settings.ts';

/** The Furnace version renders are made with, as clip.json records it. */
export const FURNACE_VERSION = '0.6.8.3';
/** Milliseconds before a failed render is tried again, times the number of the try. */
const RETRY_PAUSE = 1000;
/** Tries before a render is given up. */
const TRIES = 3;

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
    if (attempt > 1) await wait(RETRY_PAUSE * (attempt - 1));
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
    }
  }
  throw new Error(`Furnace failed ${TRIES} times on ${furFile}: ${String(lastError)}`);
}

function runFurnace(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const furnace = spawn(getSettings().furnace, args, { stdio: ['ignore', 'ignore', 'pipe'] });
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

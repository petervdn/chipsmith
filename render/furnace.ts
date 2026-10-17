/**
 * Rendering a .fur to a WAV with the Furnace app's command line. Furnace opens a CoreMIDI client every
 * time it starts, which macOS has refused after many quick launches: renders run one at a time, and a
 * failed render is tried again after a pause that grows (docs/adr/0015, docs/later.md). 75 renders
 * back to back without a pause all worked (2026-10-17). A render that takes longer than RENDER_LIMIT
 * is stopped and not tried again: a .fur that Furnace hangs on (seen 2026-10-17) would hang again.
 * The same runs write a WAV per channel, or the song as Furnace's text export.
 */
import { spawn } from 'node:child_process';
import { getSettings } from '../config/settings.ts';

/** Milliseconds before a failed render is tried again, times the number of the try. */
const RETRY_PAUSE = 1000;
/** Tries before a render is given up. */
const TRIES = 3;
/** Milliseconds a render may take; a song of minutes renders in seconds. */
const RENDER_LIMIT = 90 * 1000;

/** A render stopped for taking too long. */
class RenderTimeout extends Error {}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Renders a .fur once through (no loop) to a WAV file. Renders wait for each other, and a failed
 * one is tried again after a pause, up to three tries in all.
 *
 * @param furFile - The path of the .fur to render.
 * @param wavFile - The path of the WAV to write.
 * @returns A promise that settles once the WAV is written, or rejects once every try has failed.
 */
export function renderToWav(furFile: string, wavFile: string): Promise<void> {
  return runInTurn(furFile, ['-loops', '0', '-output', wavFile]);
}

/**
 * Renders a .fur once through to a WAV file per channel, as Furnace names them: the given name with
 * `_c01`, `_c02`… before `.wav`, the first channel 1. In turn with the other renders, and tried
 * again as they are.
 *
 * @param furFile - The path of the .fur to render.
 * @param wavFile - The path the channels' names are made from, ending in `.wav`.
 * @returns A promise that settles once the WAVs are written, or rejects once every try has failed.
 */
export function renderChannelsToWav(furFile: string, wavFile: string): Promise<void> {
  return runInTurn(furFile, ['-loops', '0', '-outmode', 'perchan', '-output', wavFile]);
}

/**
 * Writes a .fur as Furnace's text export: its information, chips, instruments and every pattern.
 * In turn with the renders, and tried again as they are.
 *
 * @param furFile - The path of the .fur.
 * @param textFile - The path of the text file to write.
 * @returns A promise that settles once the text is written, or rejects once every try has failed.
 */
export function exportText(furFile: string, textFile: string): Promise<void> {
  return runInTurn(furFile, ['-txtout', textFile]);
}

/**
 * Runs Furnace on a .fur once the runs before it are done.
 *
 * @param furFile - The path of the .fur.
 * @param outputArgs - What Furnace is asked to write.
 * @returns A promise that settles once it has, or rejects once every try has failed.
 */
function runInTurn(furFile: string, outputArgs: string[]): Promise<void> {
  const run = queue.then(() => runWithRetries(furFile, outputArgs));
  queue = run.catch(() => undefined);
  return run;
}

async function runWithRetries(furFile: string, outputArgs: string[]): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= TRIES; attempt++) {
    if (attempt > 1) await wait(RETRY_PAUSE * (attempt - 1));
    try {
      await runFurnace(['-loglevel', 'error', '-nostatus', ...outputArgs, furFile]);
      return;
    } catch (error) {
      if (error instanceof RenderTimeout) throw error;
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
    const timer = setTimeout(() => {
      furnace.kill('SIGKILL');
      reject(
        new RenderTimeout(`Furnace took longer than ${RENDER_LIMIT / 1000} s and was stopped`),
      );
    }, RENDER_LIMIT);
    furnace.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    furnace.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`exit ${code}: ${errors.trim()}`));
    });
  });
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

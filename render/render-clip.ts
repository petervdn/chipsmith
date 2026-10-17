/**
 * A clip's audio: its source.fur rendered by Furnace and written as audio.flac beside it. A clip's
 * audio is never replaced (docs/adr/0005): a clip that has its audio is refused. The FLAC is written
 * beside it under another name and renamed when whole, so a half-written file is never served.
 */
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodeFlac } from './flac.ts';
import { getFurnaceVersion } from '../config/programs.ts';
import { renderToWav } from './furnace.ts';
import { getWavFacts } from './wav.ts';

/** What rendering found out about the audio. */
export type RenderedAudio = { seconds: number; furnace: string };

/** Renders `<clipFolder>/source.fur` to `<clipFolder>/audio.flac`. */
export async function renderClipAudio(clipFolder: string): Promise<RenderedAudio> {
  const furFile = join(clipFolder, 'source.fur');
  const flacFile = join(clipFolder, 'audio.flac');
  if (!existsSync(furFile)) throw new Error(`no source.fur in ${clipFolder}`);
  if (existsSync(flacFile)) {
    throw new Error(`${flacFile} is there already; a clip's audio never changes`);
  }
  const workFolder = mkdtempSync(join(tmpdir(), 'chiptune-render-'));
  try {
    const wavFile = join(workFolder, 'audio.wav');
    await renderToWav(furFile, wavFile);
    const { seconds } = getWavFacts(readFileSync(wavFile));
    const writingFile = `${flacFile}.writing`;
    rmSync(writingFile, { force: true });
    await encodeFlac(wavFile, writingFile);
    renameSync(writingFile, flacFile);
    return { seconds, furnace: await getFurnaceVersion() };
  } finally {
    rmSync(workFolder, { recursive: true, force: true });
  }
}

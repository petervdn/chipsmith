/**
 * The quick check of a job's script, for Claude while composing: builds it, fails on a title another
 * song has (made before, or in the same script), renders every song once, and prints its length,
 * its peak and the gain that brings the peak to 0.75 of full scale. With `--takes-of <clip>` the
 * plans are takes of that clip: each is cut to the channels it keeps and fails when it does not fit
 * the clip (take-check.ts), and titles are labels, not checked.
 * Run: `node make/check-script.ts <script.ts> [--takes-of <clip>]`.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderToWav } from '../render/furnace.ts';
import { getWavFacts, getWavPeak } from '../render/wav.ts';
import { getSettings } from '../config/settings.ts';
import { readFurFile } from '../fur/read.ts';
import { getFurFileBytes } from '../fur/write.ts';
import { getChannelName } from '../shared/clip-channels.ts';
import { getTakeChannels } from '../shared/clip-lineage.ts';
import type { Clip } from '../shared/clip.types.ts';
import { openStore } from '../server/store.ts';
import type { BuiltPlan } from './build-script.ts';
import { buildScript } from './build-script.ts';
import { getClipFacts } from './fur-file-facts.ts';
import { getKeptFurFile } from './make-take.ts';
import { getTakenTitles, readSongTitles } from './song-titles.ts';
import { checkTake } from './take-check.ts';

/** The peak a mix is brought to. */
const TARGET_PEAK = 0.75;

async function checkScript(scriptFile: string, takesOf: string | null): Promise<void> {
  const folder = mkdtempSync(join(tmpdir(), 'chiptune-check-'));
  try {
    const plans = await buildScript(scriptFile, folder);
    if (takesOf) checkTakes(plans, folder, takesOf);
    else checkTitles(plans);
    for (const { title, furFileName } of plans) {
      const wavFile = join(folder, furFileName.replace(/\.fur$/, '.wav'));
      await renderToWav(join(folder, furFileName), wavFile);
      const wav = readFileSync(wavFile);
      const { seconds } = getWavFacts(wav);
      const peak = getWavPeak(wav);
      const gain = peak > 0 ? TARGET_PEAK / peak : 0;
      console.log(
        `${title}: ${seconds.toFixed(1)} s, peak ${peak.toFixed(2)}, gain to 0.75: x${gain.toFixed(2)}`,
      );
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

/**
 * Fails when a song's title is taken, by a song made before or another in the same script.
 *
 * @param plans - The songs the script built.
 */
function checkTitles(plans: BuiltPlan[]): void {
  const songsFolder = join(getSettings().dataFolder, 'songs');
  const takenTitles = getTakenTitles(
    plans.map((plan) => plan.title),
    readSongTitles(songsFolder),
  );
  if (takenTitles.length > 0) {
    throw new Error(
      `${takenTitles.join('; ')}. Choose another title, in the same number of words.`,
    );
  }
}

/**
 * Cuts each take to the channels it keeps, in place, so it is rendered as it will be kept, and
 * fails when one does not fit the clip; prints what it keeps and what is worth knowing.
 *
 * @param plans - The takes the script built.
 * @param folder - The folder their .fur files are in.
 * @param clipId - The clip they are takes of.
 */
function checkTakes(plans: BuiltPlan[], folder: string, clipId: string): void {
  const store = openStore(getSettings().dataFolder);
  const clip: Clip | undefined = store.clips.get(clipId);
  if (!clip) throw new Error(`no clip ${clipId}`);
  const channels = getTakeChannels(clip, (id) => store.clips.get(id));
  console.log(
    channels
      ? `each take keeps only ${channels.map((channel) => getChannelName(clip.chips, channel)).join(', ')}`
      : 'each take keeps every channel',
  );
  const problems: string[] = [];
  for (const { title, furFileName } of plans) {
    const file = join(folder, furFileName);
    const kept = getKeptFurFile(readFurFile(readFileSync(file)), channels);
    writeFileSync(file, getFurFileBytes(kept));
    const check = checkTake(getClipFacts(kept), clip);
    for (const note of check.notes) console.log(`${title}: ${note}`);
    problems.push(...check.problems.map((problem) => `${title} ${problem}`));
  }
  if (problems.length > 0) throw new Error(`${problems.join('; ')}.`);
}

if (import.meta.main) {
  const [scriptFile, flag, clipId] = process.argv.slice(2);
  if (!scriptFile || (flag !== undefined && (flag !== '--takes-of' || !clipId))) {
    throw new Error('usage: node make/check-script.ts <script.ts> [--takes-of <clip>]');
  }
  await checkScript(scriptFile, clipId ?? null);
}

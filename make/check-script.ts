/**
 * The quick check of a job's script, for Claude while composing: builds it, renders every song once,
 * and prints its length, its peak and the gain that brings the peak to 0.75 of full scale.
 * Run: `node make/check-script.ts <script.ts>`.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderToWav } from '../render/furnace.ts';
import { getWavFacts, getWavPeak } from '../render/wav.ts';
import { buildScript } from './build-script.ts';

/** The peak a mix is brought to. */
const TARGET_PEAK = 0.75;

async function checkScript(scriptFile: string): Promise<void> {
  const folder = mkdtempSync(join(tmpdir(), 'chiptune-check-'));
  try {
    const plans = await buildScript(scriptFile, folder);
    for (const { title, furFile } of plans) {
      const wavFile = join(folder, furFile.replace(/\.fur$/, '.wav'));
      await renderToWav(join(folder, furFile), wavFile);
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

if (import.meta.main) {
  const [scriptFile] = process.argv.slice(2);
  if (!scriptFile) throw new Error('usage: node make/check-script.ts <script.ts>');
  await checkScript(scriptFile);
}

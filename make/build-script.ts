/**
 * Building a job's script: runs it, writes each song's module as a .fur and the plans as plan.json
 * beside them. Run by the server as a process of its own, so a script that hangs or crashes does not
 * take the server with it. Run: `node make/build-script.ts <script.ts> <out folder>`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getFurFile } from '../fur/write.ts';
import { getSongPlans } from './song-plan.ts';

/** What plan.json holds of each song: the plan, with its module as a file beside it. */
export type BuiltPlan = { title: string; tags: string[]; key: string | null; furFile: string };

/** Runs the script and writes its songs' modules and plan.json into `outFolder`. */
export async function buildScript(scriptFile: string, outFolder: string): Promise<BuiltPlan[]> {
  const plans = getSongPlans(await import(pathToFileURL(resolve(scriptFile)).href));
  mkdirSync(outFolder, { recursive: true });
  const built = plans.map(({ title, module, tags, key }, i) => {
    const furFile = `${String(i + 1).padStart(2, '0')}.fur`;
    writeFileSync(join(outFolder, furFile), getFurFile(module));
    return { title, tags, key, furFile };
  });
  writeFileSync(join(outFolder, 'plan.json'), `${JSON.stringify(built, null, 2)}\n`);
  return built;
}

if (import.meta.main) {
  const [scriptFile, outFolder] = process.argv.slice(2);
  if (!scriptFile || !outFolder) {
    throw new Error('usage: node make/build-script.ts <script.ts> <out>');
  }
  const built = await buildScript(scriptFile, outFolder);
  console.log(`built ${built.length} songs: ${built.map((plan) => plan.title).join(', ')}`);
}

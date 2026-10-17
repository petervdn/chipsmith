/**
 * Building a job's script: runs it, writes each song's .fur file and the plans as plan.json
 * beside them. Run by the server as a process of its own, so a script that hangs or crashes does not
 * take the server with it. Run: `node make/build-script.ts <script.ts> <out folder>`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getFurFileBytes } from '../fur/write.ts';
import { getSongPlans } from './song-plan.ts';

/** What plan.json holds of each song: the plan, with its .fur file beside it. */
export type BuiltPlan = { title: string; tags: string[]; key: string | null; furFileName: string };

/**
 * Runs a job's script and writes each of its songs' .fur files, and plan.json listing them, into a
 * folder.
 *
 * @param scriptFile - The path of the script to run.
 * @param outFolder - The folder the .fur files and plan.json are written to, made if it is missing.
 * @returns The plan of each song, with the name of its .fur file in the folder.
 */
export async function buildScript(scriptFile: string, outFolder: string): Promise<BuiltPlan[]> {
  const plans = getSongPlans(await import(pathToFileURL(resolve(scriptFile)).href));
  mkdirSync(outFolder, { recursive: true });
  const built = plans.map(({ title, furFile, tags, key }, i) => {
    const furFileName = `${String(i + 1).padStart(2, '0')}.fur`;
    writeFileSync(join(outFolder, furFileName), getFurFileBytes(furFile));
    return { title, tags, key, furFileName };
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

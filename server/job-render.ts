/**
 * A run's script made into songs or takes once it has composed: built into a .fur file per plan in
 * a process of its own, and each rendered and made in turn (`make/make-song.ts`, `make/make-take.ts`),
 * added to the job's songs as it goes, and the store told to look again after each. A song made
 * already (after a restart) is kept, not made again. Knows nothing of Claude.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_FOLDER, getSettings } from '../config/settings.ts';
import type { FurFile } from '../fur/fur.types.ts';
import { readFurFile } from '../fur/read.ts';
import type { BuiltPlan } from '../make/build-script.ts';
import { makeSong } from '../make/make-song.ts';
import { makeTake } from '../make/make-take.ts';
import type { Tag } from '../shared/catalogue.schema.ts';
import { getTakeChannels } from '../shared/clip-lineage.ts';
import type { Job, JobSong } from '../shared/job.schema.ts';
import type { RunPlace } from './job-run-state.ts';
import { getRunFiles, updateRun } from './job-run-state.ts';
import type { JobStore } from './jobs.ts';
import { addNotes, setPhase, updateJob } from './jobs.ts';
import type { Store } from './store.ts';
import { rescanStore } from './store.ts';

/**
 * Builds a run's script and makes each song or take it plans. The job's phase moves to building
 * and rendering only when no other run of it is still composing.
 *
 * @param jobs - The jobs in memory.
 * @param store - The clips and songs.
 * @param run - The run.
 * @returns A promise that settles once every plan is made or failed; an error when the script is
 *   missing or does not build.
 */
export async function renderRun(jobs: JobStore, store: Store, run: RunPlace): Promise<void> {
  const files = getRunFiles(jobs, run);
  if (!existsSync(files.script)) throw new Error('Claude wrote no script');
  updateRun(jobs, run, { state: 'building' });
  moveJobOn(jobs, run.jobId, 'building', 'running the script');
  await runBuild(files.script, files.build);
  const plans: BuiltPlan[] = JSON.parse(readFileSync(join(files.build, 'plan.json'), 'utf8'));
  const job = jobs.jobs.get(run.jobId);
  const noun = job?.takesOf ? 'take' : 'song';
  const count = `${plans.length} ${noun}${plans.length === 1 ? '' : 's'}`;
  const isLastOfMany = (job?.runs.length ?? 1) > 1;
  moveJobOn(
    jobs,
    run.jobId,
    'rendering',
    `rendering ${isLastOfMany ? `the last run's ${count}` : count}`,
  );
  for (const plan of plans) {
    const job = jobs.jobs.get(run.jobId);
    if (!job || job.phase === 'cancelled') return;
    const isMade = job.songs.some(
      (song) => song.run === run.index && song.title === plan.title && song.state === 'done',
    );
    if (isMade) continue;
    setSong(jobs, run, plan.title, { state: 'rendering', songId: null });
    try {
      const furFile = readFurFile(readFileSync(join(files.build, plan.furFileName)));
      const songId = await makePlan(store, job, plan, furFile, files.script);
      setSong(jobs, run, plan.title, { state: 'done', songId });
      rescanStore(store);
    } catch (error) {
      setSong(jobs, run, plan.title, { state: 'failed', songId: null });
      const text = `${plan.title} failed: ${getMessage(error)}`;
      addNotes(jobs, run.jobId, [{ text, tokens: null, stage: null }]);
    }
  }
  updateRun(jobs, run, { state: 'built' });
}

/**
 * Moves a job to building or rendering, unless another of its runs still composes (the job then
 * shows as composing, its songs coming in) or it is there already.
 *
 * @param jobs - The jobs in memory.
 * @param jobId - The job.
 * @param phase - The phase it moves to.
 * @param note - The note saying so.
 */
function moveJobOn(
  jobs: JobStore,
  jobId: string,
  phase: 'building' | 'rendering',
  note: string,
): void {
  const job = jobs.jobs.get(jobId);
  if (!job || job.phase === phase || job.phase === 'cancelled') return;
  const isComposing = job.runs.some((run) => run.state === 'waiting' || run.state === 'composing');
  if (!isComposing) setPhase(jobs, jobId, phase, note);
}

/**
 * Adds a run's song to the job's songs, or changes it there.
 *
 * @param jobs - The jobs in memory.
 * @param run - The run that built it.
 * @param title - Its title.
 * @param change - Where it is, and the song made.
 * @param change.state - How far it has come.
 * @param change.songId - The song made, or the song a take was asked in; null until then.
 */
function setSong(
  jobs: JobStore,
  run: RunPlace,
  title: string,
  { state, songId }: { state: JobSong['state']; songId: string | null },
): void {
  const job = jobs.jobs.get(run.jobId);
  if (!job) return;
  const song: JobSong = { title, state, songId, run: run.index };
  const place = job.songs.findIndex((each) => each.run === run.index && each.title === title);
  const songs =
    place < 0 ? [...job.songs, song] : job.songs.map((each, i) => (i === place ? song : each));
  updateJob(jobs, run.jobId, { songs });
}

/**
 * Makes what one plan of a run's script asks for: a song, or a take of the job's clip.
 *
 * @param store - The clips and songs.
 * @param job - The job.
 * @param plan - The plan, as plan.json holds it.
 * @param furFile - The .fur file the script built for it.
 * @param scriptFile - The run's script, copied into the clip made.
 * @returns The id of the song made, or of the song a take was asked in.
 */
async function makePlan(
  store: Store,
  job: Job,
  plan: BuiltPlan,
  furFile: FurFile,
  scriptFile: string,
): Promise<string> {
  const tags = plan.tags.map((name): Tag => ({ name, by: 'claude' }));
  if (job.takesOf) {
    const parent = store.clips.get(job.takesOf.clip);
    if (!parent) throw new Error(`the clip ${job.takesOf.clip} is gone`);
    await makeTake({
      root: store.root,
      parent,
      channels: getTakeChannels(parent, (clipId) => store.clips.get(clipId)),
      songId: job.takesOf.song,
      furFile,
      label: plan.title,
      scriptFile,
      tags,
      key: plan.key,
    });
    return job.takesOf.song;
  }
  const made = await makeSong({
    root: store.root,
    title: plan.title,
    furFile,
    prompt: job.prompt,
    guides: job.guides,
    structure: job.structure,
    harmony: job.harmony,
    scriptFile,
    tags,
    status: 'new',
    key: plan.key,
    promptedFrom: job.promptedFrom,
  });
  return made.songId;
}

/**
 * Runs a script in a process of its own, writing its .fur files and plan.json to a folder.
 *
 * @param scriptFile - The script.
 * @param buildFolder - Where its files go.
 * @returns A promise that settles when it is built; an error with the end of what it printed.
 */
function runBuild(scriptFile: string, buildFolder: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const build = spawn(getSettings().node, ['make/build-script.ts', scriptFile, buildFolder], {
      cwd: PROJECT_FOLDER,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let errors = '';
    build.stderr.on('data', (chunk: Buffer) => {
      errors = (errors + chunk.toString()).slice(-2000);
    });
    build.on('error', reject);
    build.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`the script failed: ${errors.trim().split('\n').slice(-3).join(' ')}`));
    });
  });
}

/**
 * Returns what an error says.
 *
 * @param error - The error, or whatever was thrown.
 * @returns Its message.
 */
export function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

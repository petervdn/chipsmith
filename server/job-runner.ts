/**
 * A job's way from prompt to songs or takes of a clip, one job at a time: Claude composes a script
 * (its notes read from its log every second), the script is built into a .fur file per song or take,
 * each is rendered and made, and the store is told to look again after each, so finished ones show
 * while the rest render.
 */
import { spawn } from 'node:child_process';
import { PROJECT_FOLDER, getSettings } from '../config/settings.ts';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Job, JobSong, TakesTarget } from '../shared/job.schema.ts';
import type { BuiltPlan } from '../make/build-script.ts';
import { makeSong } from '../make/make-song.ts';
import { makeTake } from '../make/make-take.ts';
import type { FurFile } from '../fur/fur.types.ts';
import type { Tag } from '../shared/catalogue.schema.ts';
import { getTakeChannels } from '../shared/clip-lineage.ts';
import { readFurFile } from '../fur/read.ts';
import type { LogPlace } from './claude-log.ts';
import { LOG_START, getLaterStep, readLogNews, readRunTokens } from './claude-log.ts';
import { isRunning, startClaude, stopClaude } from './claude-run.ts';
import { JOB_SYSTEM_PROMPT, getAllowedTools, getJobPrompt, getTakesPrompt } from './job-prompt.ts';
import { getChannelName } from '../shared/clip-channels.ts';
import type { JobStore } from './jobs.ts';
import { addNotes, getJobFolder, setPhase, updateJob } from './jobs.ts';
import type { Store } from './store.ts';
import { rescanStore } from './store.ts';

/** Milliseconds between looks at running jobs. */
const TICK = 1000;
/** What the runner keeps of the Claude run of the job in its composing phase. */
type ClaudeWatch = { jobId: string; pid: number | undefined; place: LogPlace };

/**
 * Starts the ticker that moves jobs on, one at a time. A job that was building or rendering when the
 * server stopped goes on where it stopped: its .fur files are built again unless it was rendering,
 * and the songs it made already are kept.
 *
 * @param jobs - The jobs in memory.
 * @param store - The clips and songs, looked at again as each song is made.
 * @param isResuming - Whether this is a new process, whose jobs that were building or rendering
 *   are resumed; in a restart within the process that work is still going on.
 * @returns A function that stops the ticker.
 */
export function startJobRunner(jobs: JobStore, store: Store, isResuming: boolean): () => void {
  let watch: ClaudeWatch | null = null;
  let isBusy = false;
  for (const job of jobs.jobs.values()) {
    if (
      (job.tokens ?? null) === null &&
      (job.phase === 'done' || job.phase === 'failed' || job.phase === 'cancelled')
    ) {
      const tokens = readRunTokens(join(getJobFolder(jobs, job.id), 'claude.log'));
      if (tokens !== null) updateJob(jobs, job.id, { tokens });
    }
  }
  const resuming = isResuming
    ? [...jobs.jobs.values()].filter((job) => job.phase === 'building' || job.phase === 'rendering')
    : [];
  async function tick(): Promise<void> {
    if (isBusy) return;
    isBusy = true;
    try {
      const resumed = resuming.shift();
      if (resumed) {
        const note = 'the server restarted; going on where it stopped';
        addNotes(jobs, resumed.id, [{ text: note, tokens: null, stage: null }]);
        await buildAndRender(jobs, store, resumed.id);
      } else if (watch && jobs.jobs.get(watch.jobId)?.phase === 'cancelled') {
        watch = null;
      } else if (watch) {
        watch = await followClaude(jobs, store, watch);
      } else {
        const composing = [...jobs.jobs.values()].find((job) => job.phase === 'composing');
        const queued = [...jobs.jobs.values()].find((job) => job.phase === 'queued');
        if (composing) watch = resumeWatching(jobs, composing);
        else if (queued) watch = startComposing(jobs, store, queued);
      }
    } catch (error) {
      const failedId = watch?.jobId ?? null;
      if (failedId && jobs.jobs.get(failedId)?.phase !== 'cancelled') {
        failJob(jobs, failedId, error);
      }
      watch = null;
    } finally {
      isBusy = false;
    }
  }
  const timer = setInterval(() => void tick(), TICK);
  return () => clearInterval(timer);
}

function startComposing(jobs: JobStore, store: Store, job: Job): ClaudeWatch {
  setPhase(jobs, job.id, 'composing', 'Claude starts composing');
  const folder = getJobFolder(jobs, job.id);
  const pid = startClaude({
    projectFolder: PROJECT_FOLDER,
    prompt: job.takesOf
      ? getTakesPrompt({
          job,
          takesOf: job.takesOf,
          folder,
          root: jobs.root,
          keptChannels: getKeptChannelNames(store, job.takesOf),
        })
      : getJobPrompt(job, folder, jobs.root),
    systemPrompt: JOB_SYSTEM_PROMPT,
    allowedTools: getAllowedTools(folder),
    logFile: join(folder, 'claude.log'),
  });
  updateJob(jobs, job.id, { claudePid: pid ?? null });
  return { jobId: job.id, pid, place: LOG_START };
}

/**
 * Returns the names of the channels a take of a clip keeps, for Claude to be told.
 *
 * @param store - The clips and songs.
 * @param takesOf - The clip the takes are of.
 * @returns The channels' names, or null when every channel is kept; an error when the clip is gone.
 */
function getKeptChannelNames(store: Store, takesOf: TakesTarget): string[] | null {
  const clip = store.clips.get(takesOf.clip);
  if (!clip) throw new Error(`the clip ${takesOf.clip} is gone`);
  const channels = getTakeChannels(clip, (clipId) => store.clips.get(clipId));
  return channels?.map((channel) => getChannelName(clip.chips, channel)) ?? null;
}

/**
 * Watches a job that was composing when the server started. Its notes so far are in job.json, so the
 * log is read from its end, unless Claude finished meanwhile.
 *
 * @param jobs - The jobs in memory.
 * @param job - The job that was composing.
 * @returns What the runner keeps of the job's Claude run.
 */
function resumeWatching(jobs: JobStore, job: Job): ClaudeWatch {
  const logFile = join(getJobFolder(jobs, job.id), 'claude.log');
  const news = readLogNews(logFile, LOG_START, PROJECT_FOLDER);
  const pid = job.claudePid ?? undefined;
  return { jobId: job.id, pid, place: news.result ? LOG_START : news };
}

/**
 * Reads what Claude said since the last look and adds it to the job's notes; when Claude is done,
 * builds and renders the songs. A Claude that ended with an error, or stopped without a result, is
 * an error.
 *
 * @param jobs - The jobs in memory.
 * @param store - The clips and songs.
 * @param watch - What the runner keeps of the job's Claude run.
 * @returns The watch, read further, or null when the job has moved past composing.
 */
async function followClaude(
  jobs: JobStore,
  store: Store,
  watch: ClaudeWatch,
): Promise<ClaudeWatch | null> {
  const folder = getJobFolder(jobs, watch.jobId);
  const news = readLogNews(join(folder, 'claude.log'), watch.place, PROJECT_FOLDER);
  if (news.notes.length > 0) addNotes(jobs, watch.jobId, news.notes);
  const composeStep = jobs.jobs.get(watch.jobId)?.composeStep ?? null;
  const laterStep = getLaterStep(composeStep, news.composeStep);
  if (laterStep !== composeStep) updateJob(jobs, watch.jobId, { composeStep: laterStep });
  if (news.tokens > 0) {
    updateJob(jobs, watch.jobId, {
      tokens: (jobs.jobs.get(watch.jobId)?.tokens ?? 0) + news.tokens,
    });
  }
  const current = jobs.jobs.get(watch.jobId);
  if (current?.now !== news.now || current.nowTokens !== news.nowTokens) {
    updateJob(jobs, watch.jobId, { now: news.now, nowTokens: news.nowTokens });
  }
  if (news.result) {
    updateJob(jobs, watch.jobId, {
      summary: news.result.text,
      now: null,
      nowTokens: null,
      tokens: news.result.tokens ?? jobs.jobs.get(watch.jobId)?.tokens ?? null,
    });
    if (news.result.isError) throw new Error(`Claude stopped with an error: ${news.result.text}`);
    await buildAndRender(jobs, store, watch.jobId);
    return null;
  }
  if (watch.pid !== undefined && !isRunning(watch.pid)) {
    throw new Error('Claude stopped without a result (see claude.log)');
  }
  return { ...watch, place: { position: news.position, progress: news.progress } };
}

async function buildAndRender(jobs: JobStore, store: Store, jobId: string): Promise<void> {
  const folder = getJobFolder(jobs, jobId);
  const scriptFile = join(folder, 'script.ts');
  if (!existsSync(scriptFile)) throw new Error('Claude wrote no script.ts');
  const buildFolder = join(folder, 'build');
  const planFile = join(buildFolder, 'plan.json');
  const before = jobs.jobs.get(jobId);
  if (before?.phase !== 'rendering' || !existsSync(planFile)) {
    setPhase(jobs, jobId, 'building', 'running the script');
    await runBuild(scriptFile, buildFolder);
    if (jobs.jobs.get(jobId)?.phase === 'cancelled') return;
  }
  const plans: BuiltPlan[] = JSON.parse(readFileSync(planFile, 'utf8'));
  let songs: JobSong[] = plans.map(({ title }, i) => {
    const made = before?.songs[i];
    return made?.state === 'done' && made.title === title
      ? made
      : { title, state: 'waiting', songId: null };
  });
  updateJob(jobs, jobId, { songs });
  setPhase(
    jobs,
    jobId,
    'rendering',
    `rendering ${plans.length} ${getMadeNoun(before, plans.length)}`,
  );
  const job = jobs.jobs.get(jobId);
  if (!job) return;
  for (const [i, plan] of plans.entries()) {
    if (jobs.jobs.get(jobId)?.phase === 'cancelled') return;
    if (songs[i]?.state === 'done') continue;
    songs = songs.map((song, index) => (index === i ? { ...song, state: 'rendering' } : song));
    updateJob(jobs, jobId, { songs });
    try {
      const furFile = readFurFile(readFileSync(join(buildFolder, plan.furFileName)));
      const songId = await makePlan(store, job, plan, furFile, scriptFile);
      songs = songs.map((song, index) => (index === i ? { ...song, state: 'done', songId } : song));
      rescanStore(store);
    } catch (error) {
      songs = songs.map((song, index) => (index === i ? { ...song, state: 'failed' } : song));
      addNotes(jobs, jobId, [
        { text: `${plan.title} failed: ${getMessage(error)}`, tokens: null, stage: null },
      ]);
    }
    updateJob(jobs, jobId, { songs });
  }
  if (jobs.jobs.get(jobId)?.phase === 'cancelled') return;
  const failed = songs.filter((song) => song.state === 'failed').length;
  setPhase(
    jobs,
    jobId,
    failed === songs.length ? 'failed' : 'done',
    failed ? `done, ${failed} failed` : 'done',
  );
}

/**
 * Makes what one plan of a job's script asks for: a song, or a take of the job's clip.
 *
 * @param store - The clips and songs.
 * @param job - The job.
 * @param plan - The plan, as plan.json holds it.
 * @param furFile - The .fur file the script built for it.
 * @param scriptFile - The job's script, copied into the clip made.
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
 * Returns what a job makes, as a word for a count of them.
 *
 * @param job - The job, or undefined when it is gone.
 * @param count - How many.
 * @returns "song", "songs", "take" or "takes".
 */
function getMadeNoun(job: Job | undefined, count: number): string {
  const noun = job?.takesOf ? 'take' : 'song';
  return count === 1 ? noun : `${noun}s`;
}

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

function failJob(jobs: JobStore, jobId: string, error: unknown): void {
  updateJob(jobs, jobId, { error: getMessage(error) });
  setPhase(jobs, jobId, 'failed', `failed: ${getMessage(error)}`);
}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Cancels a job on its way: one waiting or composing stops at once (Claude is stopped), one building
 * or rendering stops after the song it is on. The songs made already stay.
 *
 * @param jobs - The jobs in memory.
 * @param jobId - The job to cancel; one that is over is left as it is.
 */
export function cancelJob(jobs: JobStore, jobId: string): void {
  const job = jobs.jobs.get(jobId);
  if (!job || job.finished) return;
  if (job.phase === 'composing' && job.claudePid) stopClaude(job.claudePid);
  setPhase(
    jobs,
    jobId,
    'cancelled',
    job.phase === 'building' || job.phase === 'rendering'
      ? 'cancelled; the song being made is finished, the rest are not'
      : 'cancelled',
  );
}

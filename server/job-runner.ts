/**
 * A job's way from prompt to songs, one job at a time: Claude composes a script (its notes read from
 * its log every second), the script is built into a module per song, each song is rendered and made,
 * and the store is told to look again after each, so finished songs show while the rest render.
 */
import { spawn } from 'node:child_process';
import { getSettings } from '../config/settings.ts';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Job, JobSong } from '../shared/job.types.ts';
import type { BuiltPlan } from '../make/build-script.ts';
import { makeSong } from '../make/make-song.ts';
import { readModule } from '../fur/read.ts';
import { isRunning, readLogNews, startClaude } from './claude-run.ts';
import type { JobStore } from './jobs.ts';
import { addNotes, getJobFolder, setPhase, updateJob } from './jobs.ts';
import type { Store } from './store.ts';
import { rescanStore } from './store.ts';

/** Milliseconds between looks at running jobs. */
const TICK = 1000;
/** The tools a job's Claude may use without asking: nobody is at its terminal. */
function getAllowedTools(jobId: string): string[] {
  return [
    'Read',
    'Glob',
    'Grep',
    'TodoWrite',
    `Write(jobs/${jobId}/**)`,
    `Edit(jobs/${jobId}/**)`,
    'Bash(node make/check-script.ts *)',
    'Bash(node fur/dump.ts *)',
  ];
}
const SYSTEM_PROMPT = [
  'You are running headless, started from the chiptune app; the user is not at this terminal and cannot answer.',
  'Read notes/making-songs.md first and follow it.',
  'Before each step, say in one short line what you are about to do; the user sees these lines live.',
  'Finish with a short plain reply (1-3 sentences): what you made and anything the user should know.',
].join(' ');

/** What the runner keeps of the Claude run of the job in its composing phase. */
type ClaudeWatch = { jobId: string; pid: number | undefined; position: number };

/** Starts the ticker that moves jobs on; gives a function that stops it. */
export function startJobRunner(jobs: JobStore, store: Store): () => void {
  let watch: ClaudeWatch | null = null;
  let isBusy = false;
  for (const job of jobs.jobs.values()) {
    if (job.phase === 'building' || job.phase === 'rendering') {
      setPhase(jobs, job.id, 'failed', 'stopped: the server restarted during this phase');
    }
  }
  async function tick(): Promise<void> {
    if (isBusy) return;
    isBusy = true;
    try {
      if (watch) {
        watch = await followClaude(jobs, store, watch);
      } else {
        const composing = [...jobs.jobs.values()].find((job) => job.phase === 'composing');
        const queued = [...jobs.jobs.values()].find((job) => job.phase === 'queued');
        if (composing) watch = resumeWatching(jobs, composing);
        else if (queued) watch = startComposing(jobs, queued);
      }
    } catch (error) {
      if (watch) failJob(jobs, watch.jobId, error);
      watch = null;
    } finally {
      isBusy = false;
    }
  }
  const timer = setInterval(() => void tick(), TICK);
  return () => clearInterval(timer);
}

function startComposing(jobs: JobStore, job: Job): ClaudeWatch {
  setPhase(jobs, job.id, 'composing', 'Claude starts composing');
  const folder = getJobFolder(jobs, job.id);
  const pid = startClaude({
    projectFolder: jobs.root,
    prompt: [
      `Job ${job.id}. Write the script to jobs/${job.id}/script.ts.`,
      '',
      "the user's prompt:",
      job.prompt,
    ].join('\n'),
    systemPrompt: SYSTEM_PROMPT,
    allowedTools: getAllowedTools(job.id),
    logFile: join(folder, 'claude.log'),
  });
  updateJob(jobs, job.id, { claudePid: pid ?? null });
  return { jobId: job.id, pid, position: 0 };
}

/**
 * Watches a job that was composing when the server started: its notes so far are in job.json, so
 * the log is read from its end, unless Claude finished meanwhile.
 */
function resumeWatching(jobs: JobStore, job: Job): ClaudeWatch {
  const logFile = join(getJobFolder(jobs, job.id), 'claude.log');
  const news = readLogNews(logFile, 0, jobs.root);
  const pid = job.claudePid ?? undefined;
  return { jobId: job.id, pid, position: news.result ? 0 : news.position };
}

/** Reads what Claude said since the last look; when it is done, builds and renders. */
async function followClaude(
  jobs: JobStore,
  store: Store,
  watch: ClaudeWatch,
): Promise<ClaudeWatch | null> {
  const folder = getJobFolder(jobs, watch.jobId);
  const news = readLogNews(join(folder, 'claude.log'), watch.position, jobs.root);
  if (news.notes.length > 0) addNotes(jobs, watch.jobId, news.notes);
  if (news.result) {
    updateJob(jobs, watch.jobId, { summary: news.result.text });
    if (news.result.isError) throw new Error(`Claude stopped with an error: ${news.result.text}`);
    await buildAndRender(jobs, store, watch.jobId);
    return null;
  }
  if (watch.pid !== undefined && !isRunning(watch.pid)) {
    throw new Error('Claude stopped without a result (see claude.log)');
  }
  return { ...watch, position: news.position };
}

async function buildAndRender(jobs: JobStore, store: Store, jobId: string): Promise<void> {
  const folder = getJobFolder(jobs, jobId);
  const scriptFile = join(folder, 'script.ts');
  if (!existsSync(scriptFile)) throw new Error('Claude wrote no script.ts');
  setPhase(jobs, jobId, 'building', 'running the script');
  const buildFolder = join(folder, 'build');
  await runBuild(jobs.root, scriptFile, buildFolder);
  const plans: BuiltPlan[] = JSON.parse(readFileSync(join(buildFolder, 'plan.json'), 'utf8'));
  let songs: JobSong[] = plans.map(({ title }) => ({ title, state: 'waiting', songId: null }));
  updateJob(jobs, jobId, { songs });
  setPhase(
    jobs,
    jobId,
    'rendering',
    `rendering ${plans.length} ${plans.length === 1 ? 'song' : 'songs'}`,
  );
  const job = jobs.jobs.get(jobId);
  for (const [i, plan] of plans.entries()) {
    songs = songs.map((song, index) => (index === i ? { ...song, state: 'rendering' } : song));
    updateJob(jobs, jobId, { songs });
    try {
      const made = await makeSong({
        root: store.root,
        title: plan.title,
        module: readModule(readFileSync(join(buildFolder, plan.furFile))),
        prompt: job?.prompt ?? '',
        promptId: jobId,
        scriptFile,
        tags: plan.tags.map((name) => ({ name, by: 'claude' })),
        status: 'new',
        key: plan.key,
        promptedFrom: job?.promptedFrom ?? null,
      });
      songs = songs.map((song, index) =>
        index === i ? { ...song, state: 'done', songId: made.songId } : song,
      );
      rescanStore(store);
    } catch (error) {
      songs = songs.map((song, index) => (index === i ? { ...song, state: 'failed' } : song));
      addNotes(jobs, jobId, [`${plan.title} failed: ${getMessage(error)}`]);
    }
    updateJob(jobs, jobId, { songs });
  }
  const failed = songs.filter((song) => song.state === 'failed').length;
  setPhase(
    jobs,
    jobId,
    failed === songs.length ? 'failed' : 'done',
    failed ? `done, ${failed} failed` : 'done',
  );
}

function runBuild(projectFolder: string, scriptFile: string, buildFolder: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const build = spawn(getSettings().node, ['make/build-script.ts', scriptFile, buildFolder], {
      cwd: projectFolder,
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

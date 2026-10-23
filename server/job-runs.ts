/**
 * One Claude run of a job: started with its own prompt (its part of the job when there are
 * several) and files, followed through its log every second (its notes, tokens and what it is in
 * the middle of become the job's), and picked up again after a server restart. Knows nothing of
 * builds, renders or how many runs go at once.
 */
import { PROJECT_FOLDER } from '../config/settings.ts';
import { DEFAULT_COMPOSER_MODEL } from '../shared/composer-models.ts';
import type { Job, NewNote } from '../shared/job.schema.ts';
import type { LogPlace } from './claude-log.ts';
import { LOG_START, getLaterStep, readLogNews } from './claude-log.ts';
import { isRunning, startClaude } from './claude-run.ts';
import { getJobKnowledge } from './job-knowledge.ts';
import {
  JOB_TOOLS,
  getAllowedTools,
  getJobPrompt,
  getJobSystemPrompt,
  getTakesPrompt,
} from './job-prompt.ts';
import type { RunPlace } from './job-run-state.ts';
import { getRunFiles, getRunName, updateRun } from './job-run-state.ts';
import type { JobStore } from './jobs.ts';
import { addNotes, getJobFolder, updateJob } from './jobs.ts';
import type { Store } from './store.ts';
import { getTakeContext } from './take-context.ts';

/** What the runner keeps of a run while it composes. */
export type RunWatch = RunPlace & { pid: number | undefined; place: LogPlace };

/**
 * Starts a run of a job: its prompt (its part, when the job has several runs), Claude with the
 * job's model and effort, its log in its own file.
 *
 * @param jobs - The jobs in memory.
 * @param store - The clips and songs, for a job of takes.
 * @param run - The run to start.
 * @returns What the runner keeps of it.
 */
export function startRun(jobs: JobStore, store: Store, run: RunPlace): RunWatch {
  const job = jobs.jobs.get(run.jobId);
  if (!job) throw new Error(`no job ${run.jobId}`);
  const folder = getJobFolder(jobs, job.id);
  const files = getRunFiles(jobs, run);
  const part = { index: run.index, count: job.runs.length };
  const pid = startClaude({
    projectFolder: PROJECT_FOLDER,
    prompt: job.takesOf
      ? getTakesPrompt({
          job,
          folder,
          root: jobs.root,
          scriptFile: files.script,
          part,
          context: getTakeContext(store, job.takesOf),
        })
      : getJobPrompt({ job, folder, root: jobs.root, scriptFile: files.script, part }),
    systemPrompt: getJobSystemPrompt(getJobKnowledge(PROJECT_FOLDER)),
    tools: JOB_TOOLS,
    allowedTools: getAllowedTools(folder),
    model: job.model ?? DEFAULT_COMPOSER_MODEL,
    effort: job.effort,
    logFile: files.log,
  });
  updateRun(jobs, run, { state: 'composing', pid: pid ?? null });
  return { ...run, pid, place: LOG_START };
}

/**
 * Picks a run up again that was composing when the runner started. Its notes so far are in
 * job.json, so its log is read from its end, unless Claude finished meanwhile.
 *
 * @param jobs - The jobs in memory.
 * @param run - The run.
 * @param pid - Its Claude's process id, if it was kept.
 * @returns What the runner keeps of it.
 */
export function resumeRun(jobs: JobStore, run: RunPlace, pid: number | undefined): RunWatch {
  const news = readLogNews(getRunFiles(jobs, run).log, LOG_START, PROJECT_FOLDER);
  return { ...run, pid, place: news.result ? LOG_START : news };
}

/**
 * Reads what a run's Claude said since the last look and adds it to the job: its notes (named by
 * the run's part when there are several), its tokens, what it is in the middle of, how far it came.
 * A Claude that ended with an error, or stopped without a result, is an error.
 *
 * @param jobs - The jobs in memory.
 * @param watch - What the runner keeps of the run.
 * @returns The watch, read further, or null when the run has composed its script.
 */
export function followRun(jobs: JobStore, watch: RunWatch): RunWatch | null {
  const before = jobs.jobs.get(watch.jobId);
  const run = before?.runs[watch.index];
  if (!before || !run) return null;
  const news = readLogNews(getRunFiles(jobs, watch).log, watch.place, PROJECT_FOLDER);
  const isOneOfMany = before.runs.length > 1;
  const name = getRunName(before, watch.index);
  if (news.notes.length > 0) {
    addNotes(
      jobs,
      watch.jobId,
      isOneOfMany
        ? news.notes.map((note) => ({ ...note, text: `${name}: ${note.text}`, stage: null }))
        : news.notes,
    );
  }
  const composeStep = getLaterStep(run.composeStep, news.composeStep);
  const tokens = news.result?.tokens ?? (run.tokens ?? 0) + news.tokens;
  const job = updateRun(jobs, watch, {
    composeStep,
    tokens: tokens > 0 ? tokens : run.tokens,
    ...(news.result ? { summary: news.result.text } : {}),
  });
  if (isOneOfMany) addStageNote(jobs, before, job);
  const now = news.now && isOneOfMany ? `${name}: ${news.now}` : news.now;
  if (job.now !== now || job.nowTokens !== news.nowTokens) {
    updateJob(jobs, watch.jobId, { now, nowTokens: news.nowTokens });
  }
  if (news.result) {
    updateJob(jobs, watch.jobId, { now: null, nowTokens: null });
    if (news.result.isError) throw new Error(`Claude stopped with an error: ${news.result.text}`);
    updateRun(jobs, watch, { state: 'composed', pid: null });
    return null;
  }
  if (watch.pid !== undefined && !isRunning(watch.pid)) {
    throw new Error('Claude stopped without a result (see its log)');
  }
  return { ...watch, place: { position: news.position, progress: news.progress } };
}

/**
 * Adds a note marking a stage when a job of several runs reaches it: when the last of its runs
 * has started writing, or checking (both, when it went from neither straight to checking).
 *
 * @param jobs - The jobs in memory.
 * @param before - The job before its run changed.
 * @param after - The job after.
 */
function addStageNote(jobs: JobStore, before: Job, after: Job): void {
  if (!after.composeStep || after.composeStep === before.composeStep) return;
  const noun = before.takesOf ? 'takes' : 'songs';
  const writing: NewNote = { text: `writing all the ${noun}`, tokens: null, stage: 'writing' };
  const checking: NewNote = { text: `checking all the ${noun}`, tokens: null, stage: 'checking' };
  if (after.composeStep === 'writing') addNotes(jobs, after.id, [writing]);
  else addNotes(jobs, after.id, before.composeStep === null ? [writing, checking] : [checking]);
}

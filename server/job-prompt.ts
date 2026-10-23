/**
 * What a job's Claude is told: the prompt it is sent (where to write, the user's prompt and what
 * was chosen with it, or the clip to make takes of), what it is told before that, and the tools it
 * may use. Knows nothing of how a
 * job runs.
 */
import { isAbsolute, join, relative } from 'node:path';
import { PROJECT_FOLDER } from '../config/settings.ts';
import type { SentGuide } from '../shared/guide.schema.ts';
import type { Job } from '../shared/job.schema.ts';
import { getHarmonyLines } from '../shared/harmony-prompt.ts';
import { getStructureLines } from '../shared/structure-prompt.ts';
import { getTitleWordCounts } from '../make/song-titles.ts';
import type { TakeContext } from './take-context.ts';

/** The only tools a job's Claude has: their definitions are most of its context otherwise. */
export const JOB_TOOLS = ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Bash'];

/**
 * Returns the tools a job's Claude may use without asking, since nobody is at its terminal.
 *
 * @param jobFolder - The job's folder, the only one Claude may write in.
 * @returns The tools, as Claude Code's `--allowedTools` reads them.
 */
export function getAllowedTools(jobFolder: string): string[] {
  const writable = getPermissionPath(jobFolder);
  return [
    'Read',
    'Glob',
    'Grep',
    `Write(${writable}/**)`,
    `Edit(${writable}/**)`,
    'Bash(node make/check-script.ts *)',
    'Bash(node fur/dump.ts *)',
  ];
}
/**
 * Returns what a job's Claude is told before the prompt: how it runs, what it ends with, and the
 * skills and example script it composes by, given in full (job-knowledge.ts).
 *
 * @param knowledge - The skills and the example script, as one text.
 * @returns The system prompt's addition.
 */
export function getJobSystemPrompt(knowledge: string): string {
  return [
    [
      'You are running headless, started from the chiptune app; the user is not at this terminal and cannot answer.',
      'Follow the write-song skill; it leads to furnace-song and the chip skills.',
      'Those skills and make/example-script.ts are given below in full, with the API furnace-song lists: do not load the skills or read those files again.',
      'Before each step, say in one short line what you are about to do; the user sees these lines live.',
      'That includes the long ones: say a line before you plan the songs and before you write or rewrite the script.',
      'Finish with a short plain reply (1-3 sentences): what you made and anything the user should know.',
    ].join(' '),
    knowledge,
  ].join('\n\n');
}

/**
 * Returns a folder as Claude Code's permissions read it: relative to the project folder it runs in,
 * or else `//` and its absolute path.
 *
 * @param folder - The folder.
 * @returns The folder's path for a permission.
 */
function getPermissionPath(folder: string): string {
  const path = getProjectPath(folder);
  return isAbsolute(path) ? `/${path}` : path;
}

/**
 * Returns a path as seen from the project folder: relative inside it, absolute outside it.
 *
 * @param path - The path.
 * @returns The path, relative to the project folder when it is inside it.
 */
function getProjectPath(path: string): string {
  const fromProject = relative(PROJECT_FOLDER, path);
  return fromProject.startsWith('..') || isAbsolute(fromProject) ? path : fromProject;
}

/**
 * Returns the lines that add the style guides sent with the prompt to it, each under its name
 * (docs/adr/0019).
 *
 * @param guides - The guides sent with the prompt.
 * @returns The lines, or none when no guide was sent.
 */
function getGuideLines(guides: SentGuide[]): string[] {
  if (guides.length === 0) return [];
  return [
    '',
    'Style guides sent with the prompt (follow them; the prompt itself wins where they differ):',
    ...guides.flatMap(({ name, text }) => ['', `## ${name}`, '', text.trim()]),
  ];
}

/** A run's part of its job: its place among the runs, from 0, and how many there are. */
export type RunPart = { index: number; count: number };

/** What each take of several leans on to stand apart, by its place. */
const TAKE_LEANS = ['the rhythm', 'the register', 'the contour', 'the density', 'the articulation'];

/**
 * Returns the lines that tell a run its part of a job of several runs, which compose at once
 * without seeing each other, and how its song or take stands apart from the others.
 *
 * @param part - The run's part.
 * @param part.index - Its place among the runs, from 0.
 * @param part.count - How many runs there are.
 * @param isTakes - Whether the job makes takes of a clip.
 * @returns The lines, or none for a job of one run.
 */
function getPartLines({ index, count }: RunPart, isTakes: boolean): string[] {
  if (count <= 1) return [];
  const noun = isTakes ? 'take' : 'song';
  const number = index + 1;
  return [
    `This is ${noun} ${number} of ${count}: the others are made at the same time by other runs, which you cannot see.`,
    isTakes
      ? `Make yours stand apart from them by leaning on ${TAKE_LEANS[index % TAKE_LEANS.length]}.`
      : `Make yours stand apart: of the ${count}, from the slowest to the fastest, yours is number ${number} (unless the prompt sets the tempo); choose its meter and groove to differ too.`,
  ];
}

/** What a prompt for songs is made from. */
export type JobPromptParts = {
  job: Job;
  /** The job's folder. */
  folder: string;
  /** The data folder. */
  root: string;
  /** The run's script. */
  scriptFile: string;
  /** The run's part of the job. */
  part: RunPart;
};

/**
 * Returns the prompt a run of a job is sent: the job, where its script goes, how many songs and
 * its part of them, the user's prompt and the guides, structure and harmony sent with it.
 *
 * @param parts - What the prompt is made from.
 * @param parts.job - The job.
 * @param parts.folder - The job's folder.
 * @param parts.root - The data folder.
 * @param parts.scriptFile - The run's script.
 * @param parts.part - The run's part of the job.
 * @returns The prompt, as lines joined.
 */
export function getJobPrompt({ job, folder, root, scriptFile, part }: JobPromptParts): string {
  const songCount = part.count > 1 ? 1 : job.songCount;
  return [
    `Job ${job.id}. Write the script to ${getProjectPath(scriptFile)}.`,
    `The data folder (songs/, clips/) is ${getProjectPath(root)}.`,
    `The script imports the project's modules from ${relative(folder, PROJECT_FOLDER)}/ (e.g. ${relative(folder, PROJECT_FOLDER)}/make/score.ts).`,
    '',
    songCount
      ? `Make ${songCount} ${songCount === 1 ? 'song' : 'songs'}: this count wins over any in the prompt.`
      : '',
    songCount
      ? `Title the songs in this many words, in order: ${getTitleWordCounts(songCount).join(', ')}.`
      : '',
    ...getPartLines(part, false),
    "The user's prompt:",
    job.prompt,
    ...getGuideLines(job.guides),
    ...(job.structure ? getStructureLines(job.structure) : []),
    ...(job.harmony ? getHarmonyLines(job.harmony) : []),
  ].join('\n');
}

/** What a prompt for takes of a clip is made from. */
export type TakesPromptParts = {
  job: Job;
  /** The job's folder. */
  folder: string;
  /** The data folder. */
  root: string;
  /** The run's script. */
  scriptFile: string;
  /** The run's part of the job. */
  part: RunPart;
  /** What the server worked out of the clip (take-context.ts). */
  context: TakeContext;
};

/**
 * Returns the lines that tell Claude the clip: its facts, its song, the channels a take keeps and
 * how to start from it, and the script that wrote it (or the clip as tracker text).
 *
 * @param context - What the server worked out of the clip.
 * @param clipFolder - The clip's folder, as seen from the project folder.
 * @returns The lines.
 */
function getClipLines(context: TakeContext, clipFolder: string): string[] {
  const { keptChannels, script, trackerText } = context;
  const kept = keptChannels?.map(({ channel, name }) => `${name} (channel ${channel})`).join(', ');
  return [
    `The clip ${context.clipId}, "${context.label}", in the song "${context.songTitle}" (${context.songId}): ${context.bpm} bpm, ${context.beats} beats to a bar, ${context.seconds.toFixed(1)} s, on ${context.chips.join(' + ')}.`,
    `Its .fur file is ${clipFolder}/source.fur: every channel a run of ${context.rowCount} rows, ${context.rowsPerBar} to a bar.`,
    kept
      ? `The clip is the song's ${kept} alone: a take keeps only that channel of what your script makes, so change it there and leave the rest as it is.`
      : 'The clip is the whole song: a take keeps every channel.',
    'Start each take from that .fur file and replace only the channels it changes (furnace-song, "Takes of a clip").',
    `The song's tracks: ${context.tracks.join('; ')}.`,
    '',
    script === null
      ? 'The clip has no script; here it is as tracker text (given: do not read clip.json, song.json or source.fur as text):'
      : 'The script that wrote the clip (given: do not read it, clip.json or song.json):',
    '```' + (script === null ? '' : 'ts'),
    (script ?? trackerText ?? '').trim(),
    '```',
  ];
}

/**
 * Returns the prompt a job's Claude is sent to make takes of a clip (docs/adr/0037): the job, where
 * its script goes, the clip, its song and what a take keeps, the count, the check, the user's
 * prompt and the style guides chosen with it.
 *
 * @param parts - What the prompt is made from.
 * @param parts.job - The job.
 * @param parts.folder - The job's folder.
 * @param parts.root - The data folder.
 * @param parts.scriptFile - The run's script.
 * @param parts.part - The run's part of the job.
 * @param parts.context - What the server worked out of the clip.
 * @returns The prompt, as lines joined.
 */
export function getTakesPrompt({
  job,
  folder,
  root,
  scriptFile: runScript,
  part,
  context,
}: TakesPromptParts): string {
  const scriptFile = getProjectPath(runScript);
  const takeCount = part.count > 1 ? 1 : (job.songCount ?? 1);
  return [
    `Job ${job.id}: takes of a clip (the furnace-song skill, "Takes of a clip"). Write the script to ${scriptFile}.`,
    `The data folder (songs/, clips/) is ${getProjectPath(root)}.`,
    `The script imports the project's modules from ${relative(folder, PROJECT_FOLDER)}/ (e.g. ${relative(folder, PROJECT_FOLDER)}/make/score.ts).`,
    '',
    ...getClipLines(context, getProjectPath(join(root, 'clips', context.clipId))),
    '',
    `Make ${takeCount} ${takeCount === 1 ? 'take' : 'takes'}: one plan each, the clip changed as the prompt asks${takeCount === 1 ? '' : ', each in its own way'}.`,
    'Title each plan with its label: what it changed, in 2 to 5 words, lower case ("walking bass", "octave jumps").',
    ...getPartLines(part, true),
    "Keep the clip's chips and tempo, and its length unless the prompt asks for another.",
    `Check it with: node make/check-script.ts ${scriptFile} --takes-of ${context.clipId}`,
    '',
    "The user's prompt:",
    job.prompt,
    ...getGuideLines(job.guides),
  ].join('\n');
}

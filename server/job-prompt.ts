/**
 * What a job's Claude is told: the prompt it is sent (where to write, the user's prompt and what
 * was chosen with it, or the clip to make takes of), what it is told before that, and the tools it
 * may use. Knows nothing of how a
 * job runs.
 */
import { isAbsolute, join, relative } from 'node:path';
import { PROJECT_FOLDER } from '../config/settings.ts';
import type { SentGuide } from '../shared/guide.schema.ts';
import type { Job, TakesTarget } from '../shared/job.schema.ts';
import { getHarmonyLines } from '../shared/harmony-prompt.ts';
import { getStructureLines } from '../shared/structure-prompt.ts';
import { getTitleWordCounts } from '../make/song-titles.ts';

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
    'TodoWrite',
    'Skill',
    `Write(${writable}/**)`,
    `Edit(${writable}/**)`,
    'Bash(node make/check-script.ts *)',
    'Bash(node fur/dump.ts *)',
  ];
}
/** What a job's Claude is told before the prompt: how it runs and what it ends with. */
export const JOB_SYSTEM_PROMPT = [
  'You are running headless, started from the chiptune app; the user is not at this terminal and cannot answer.',
  'Use the write-song skill first and follow it; it leads to furnace-song and the chip skills.',
  'Before each step, say in one short line what you are about to do; the user sees these lines live.',
  'That includes the long ones: say a line before you plan the songs and before you write or rewrite the script.',
  'Finish with a short plain reply (1-3 sentences): what you made and anything the user should know.',
].join(' ');

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

/**
 * Returns the prompt a job's Claude is sent: the job, where its script goes, the user's prompt and
 * the guides, structure and harmony sent with it.
 *
 * @param job - The job.
 * @param folder - The job's folder.
 * @param root - The data folder.
 * @returns The prompt, as lines joined.
 */
export function getJobPrompt(job: Job, folder: string, root: string): string {
  return [
    `Job ${job.id}. Write the script to ${getProjectPath(join(folder, 'script.ts'))}.`,
    `The data folder (songs/, clips/) is ${getProjectPath(root)}.`,
    `The script imports the project's modules from ${relative(folder, PROJECT_FOLDER)}/ (e.g. ${relative(folder, PROJECT_FOLDER)}/make/fur-file-builder.ts).`,
    '',
    job.songCount
      ? `Make ${job.songCount} ${job.songCount === 1 ? 'song' : 'songs'}: this count wins over any in the prompt.`
      : '',
    job.songCount
      ? `Title the songs in this many words, in order: ${getTitleWordCounts(job.songCount).join(', ')}.`
      : '',
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
  takesOf: TakesTarget;
  /** The job's folder. */
  folder: string;
  /** The data folder. */
  root: string;
  /** The names of the channels a take keeps, or null when it keeps every channel. */
  keptChannels: string[] | null;
};

/**
 * Returns the prompt a job's Claude is sent to make takes of a clip (docs/adr/0037): the job, where
 * its script goes, the clip and its song, how many takes, what a take keeps, the check, the user's
 * prompt and the song's guides.
 *
 * @param parts - What the prompt is made from.
 * @param parts.job - The job.
 * @param parts.takesOf - The clip the takes are of, and the song it was asked in.
 * @param parts.folder - The job's folder.
 * @param parts.root - The data folder.
 * @param parts.keptChannels - The names of the channels a take keeps, or null for every channel.
 * @returns The prompt, as lines joined.
 */
export function getTakesPrompt({
  job,
  takesOf,
  folder,
  root,
  keptChannels,
}: TakesPromptParts): string {
  const scriptFile = getProjectPath(join(folder, 'script.ts'));
  const takeCount = job.songCount ?? 1;
  return [
    `Job ${job.id}: takes of a clip (the furnace-song skill, "Takes of a clip"). Write the script to ${scriptFile}.`,
    `The data folder (songs/, clips/) is ${getProjectPath(root)}.`,
    `The script imports the project's modules from ${relative(folder, PROJECT_FOLDER)}/ (e.g. ${relative(folder, PROJECT_FOLDER)}/make/fur-file-builder.ts).`,
    '',
    `The clip: ${getProjectPath(join(root, 'clips', takesOf.clip))}/ (clip.json, source.fur, script.ts), in the song ${getProjectPath(join(root, 'songs', takesOf.song, 'song.json'))}.`,
    keptChannels
      ? `The clip is the song's ${keptChannels.join(', ')} alone: a take keeps only that channel of what your script makes, so change it there and leave the rest as it is.`
      : 'The clip is the whole song: a take keeps every channel.',
    `Make ${takeCount} ${takeCount === 1 ? 'take' : 'takes'}: one plan each, the clip changed as the prompt asks${takeCount === 1 ? '' : ', each in its own way'}.`,
    'Title each plan with its label: what it changed, in 2 to 5 words, lower case ("walking bass", "octave jumps").',
    "Keep the clip's chips and tempo, and its length unless the prompt asks for another.",
    `Check it with: node make/check-script.ts ${scriptFile} --takes-of ${takesOf.clip}`,
    '',
    "The user's prompt:",
    job.prompt,
    ...getGuideLines(job.guides),
  ].join('\n');
}

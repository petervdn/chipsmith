/**
 * `/api/jobs`: the jobs listed, a prompt sent as a new job (with the style guides, structure and
 * number of songs chosen with it), a job cancelled or removed; each answers with the job or the list.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GuideStore } from './guides.ts';
import { getSentGuides } from './guides.ts';
import { readJsonBody, sendError, sendJson } from './http.ts';
import { cancelJob } from './job-runner.ts';
import type { JobStore } from './jobs.ts';
import { createJob, listJobs, removeJob } from './jobs.ts';
import { getArray, getNumber, getObject, getString, getStringOrNull } from './json-checks.ts';
import type { Store } from './store.ts';
import { checkSentHarmony } from './harmony-checks.ts';
import { checkSentStructure } from './structure-checks.ts';

/** The most songs a prompt can ask for. */
const MOST_SONGS = 6;

/**
 * Answers a request to `/api/jobs`, `/api/jobs/<id>` or `/api/jobs/<id>/cancel`.
 *
 * @param stores - What the routes read and change.
 * @param stores.store - The clips and songs, for the song a prompt is sent again from.
 * @param stores.jobs - The jobs.
 * @param stores.guides - The style guides, copied into a new job when chosen.
 * @param request - The request.
 * @param response - The response to answer on.
 * @param target - What the request is to.
 * @param target.id - The job's id, or undefined for the list.
 * @param target.file - What of the job (`cancel`), or undefined.
 * @param target.method - The request's method.
 * @returns A promise that settles when the answer is sent.
 */
export async function routeJobs(
  { store, jobs, guides }: { store: Store; jobs: JobStore; guides: GuideStore },
  request: IncomingMessage,
  response: ServerResponse,
  { id, file, method }: { id: string | undefined; file: string | undefined; method: string },
): Promise<void> {
  if (!id && method === 'GET') return sendJson(response, listJobs(jobs));
  if (!id && method === 'POST') {
    const body = getObject(await readJsonBody(request), 'body');
    const prompt = getString(body['prompt'], 'body.prompt').trim();
    if (!prompt) return sendError(response, 400, 'the prompt is empty');
    const fromSong = getStringOrNull(body['fromSong'] ?? null, 'body.fromSong');
    const song = fromSong ? store.songs.get(fromSong) : null;
    if (fromSong && !song) return sendError(response, 400, `no song ${fromSong}`);
    const guideIds = getArray(body['guideIds'] ?? [], 'body.guideIds', getString);
    const sent = getSentGuides(guides, guideIds);
    const structure = checkSentStructure(body['structure'], 'body.structure');
    const harmony = checkSentHarmony(body['harmony'], 'body.harmony');
    const songCount = getSongCount(body['songCount']);
    return sendJson(
      response,
      createJob(jobs, prompt, sent, song ? song.id : null, structure, songCount, harmony),
    );
  }
  if (!id) return sendError(response, 404, 'not found');
  if (!jobs.jobs.has(id)) return sendError(response, 404, `no job ${id}`);
  if (file === 'cancel' && method === 'POST') {
    cancelJob(jobs, id);
  } else if (!file && method === 'DELETE') {
    removeJob(jobs, id);
  } else {
    return sendError(response, 404, 'not found');
  }
  sendJson(response, listJobs(jobs));
}

/**
 * Checks how many songs a prompt asks for.
 *
 * @param value - The request's songCount, not yet checked; missing is none.
 * @returns A whole number from 1 to MOST_SONGS, or null when none was sent.
 */
function getSongCount(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const count = getNumber(value, 'body.songCount');
  if (!Number.isInteger(count) || count < 1 || count > MOST_SONGS) {
    throw new Error(`body.songCount is not a whole number from 1 to ${MOST_SONGS}`);
  }
  return count;
}

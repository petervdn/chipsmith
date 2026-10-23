/**
 * `/api/jobs`: the jobs listed, a prompt sent as a new job (with the style guides, structure and
 * number of songs chosen with it, or as takes of a clip in a song), a job cancelled or removed; each
 * answers with the job or the list.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { GuideStore } from './guides.ts';
import { getSentGuides } from './guides.ts';
import { getAppSettings } from './app-settings.ts';
import { readJsonBody, sendError, sendJson } from './http.ts';
import { cancelJob } from './job-runner.ts';
import type { JobStore } from './jobs.ts';
import { createJob, listJobs, removeJob } from './jobs.ts';
import { jobRequestSchema } from '../shared/api-requests.schema.ts';
import { parseChecked } from '../shared/schema-parse.ts';
import type { Store } from './store.ts';
import { getClipFolder } from './store.ts';
import type { TakesTarget } from '../shared/job.schema.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The most takes a prompt on a clip can ask for (docs/adr/0037). */
const MOST_TAKES = 5;

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
    const { prompt, fromSong, guideIds, structure, harmony, songCount, takesOf } = parseChecked(
      jobRequestSchema,
      await readJsonBody(request),
      'body',
    );
    const model = getAppSettings(jobs.root).composerModel;
    if (takesOf) {
      checkTakesTarget(store, takesOf);
      if (songCount !== null && songCount > MOST_TAKES) {
        return sendError(response, 400, `body.songCount: at most ${MOST_TAKES} takes`);
      }
      return sendJson(
        response,
        createJob(jobs, {
          prompt,
          guides: getSentGuides(guides, guideIds),
          promptedFrom: null,
          songCount: songCount ?? 1,
          takesOf,
          model,
        }),
      );
    }
    const song = fromSong ? store.songs.get(fromSong) : null;
    if (fromSong && !song) return sendError(response, 400, `no song ${fromSong}`);
    const sent = getSentGuides(guides, guideIds);
    return sendJson(
      response,
      createJob(jobs, {
        prompt,
        guides: sent,
        promptedFrom: song ? song.id : null,
        structure,
        songCount,
        harmony,
        model,
      }),
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
 * Checks the clip a prompt asks takes of against the store: a clip with its source.fur, in a song
 * that plays it; throws when it is not.
 *
 * @param store - The clips and songs.
 * @param target - The clip and the song, as the request names them.
 * @param target.clip - The clip's id.
 * @param target.song - The song's id.
 */
function checkTakesTarget(store: Store, { clip: clipId, song: songId }: TakesTarget): void {
  const song = store.songs.get(songId);
  if (!song) throw new Error(`no song ${songId}`);
  if (!store.clips.has(clipId)) throw new Error(`no clip ${clipId}`);
  if (!song.tracks.some((track) => track.blocks.some((block) => block.clip === clipId))) {
    throw new Error(`${songId} does not play ${clipId}`);
  }
  if (!existsSync(join(getClipFolder(store, clipId), 'source.fur'))) {
    throw new Error(`${clipId} has no source.fur to change`);
  }
}

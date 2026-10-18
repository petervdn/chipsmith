/**
 * `/api/clips`: the pool listed, a clip's record changed (status, tags, a variation's label), a copy
 * of its .fur opened in Furnace, and a take of it made by transposing it (docs/adr/0037).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ClipListing, ClipOpened, TakeMade } from '../shared/api.types.ts';
import { makeTransposedTake } from '../make/transpose-take.ts';
import { getNumber, getObject, getString } from './json-checks.ts';
import { openClipInFurnace } from './clip-files.ts';
import { readJsonBody, sendError, sendJson } from './http.ts';
import { checkClipChange } from './model-checks.ts';
import type { Store } from './store.ts';
import { getSongsUsingClip, rescanStore, saveClip } from './store.ts';

/** The most semitones a transpose moves a clip, either way: two octaves. */
const MOST_SEMITONES = 24;

/**
 * Answers a request to `/api/clips`, `/api/clips/<id>`, `/api/clips/<id>/open` or
 * `/api/clips/<id>/transpose`.
 *
 * @param store - The clips and songs.
 * @param request - The request.
 * @param response - The response to answer on.
 * @param target - What the request is to.
 * @param target.id - The clip's id, or undefined for the pool.
 * @param target.file - What of the clip (`open`, `transpose`), or undefined.
 * @param target.method - The request's method.
 * @returns A promise that settles when the answer is sent.
 */
export async function routeClips(
  store: Store,
  request: IncomingMessage,
  response: ServerResponse,
  { id, file, method }: { id: string | undefined; file: string | undefined; method: string },
): Promise<void> {
  if (!id && method === 'GET') return sendJson(response, listClips(store));
  if (!id) return sendError(response, 404, 'not found');
  if (file === 'open' && method === 'POST') {
    const copy = openClipInFurnace(store, id);
    if (!copy) return sendError(response, 404, `no .fur for ${id}`);
    const opened: ClipOpened = { file: copy };
    return sendJson(response, opened);
  }
  if (file === 'transpose' && method === 'POST') {
    const clip = store.clips.get(id);
    if (!clip) return sendError(response, 404, `no clip ${id}`);
    const body = getObject(await readJsonBody(request), 'body');
    const songId = getString(body['song'], 'body.song');
    if (!store.songs.has(songId)) return sendError(response, 400, `no song ${songId}`);
    const semitones = getSemitones(body['semitones']);
    const clipId = await makeTransposedTake({ root: store.root, parent: clip, songId, semitones });
    rescanStore(store);
    const made: TakeMade = { clipId };
    return sendJson(response, made);
  }
  if (!file && method === 'PATCH') {
    const clip = store.clips.get(id);
    if (!clip) return sendError(response, 404, `no clip ${id}`);
    saveClip(store, { ...clip, ...checkClipChange(await readJsonBody(request), clip) });
    return sendJson(response, { clip: store.clips.get(id), usedBy: getSongsUsingClip(store, id) });
  }
  sendError(response, 404, 'not found');
}

function listClips(store: Store): ClipListing[] {
  return [...store.clips.values()].map((clip) => ({
    clip,
    usedBy: getSongsUsingClip(store, clip.id),
  }));
}

/**
 * Checks how far a transpose moves a clip.
 *
 * @param value - The request's semitones, not yet checked.
 * @returns A whole number of semitones, not 0, at most MOST_SEMITONES either way.
 */
function getSemitones(value: unknown): number {
  const semitones = getNumber(value, 'body.semitones');
  if (!Number.isInteger(semitones) || semitones === 0 || Math.abs(semitones) > MOST_SEMITONES) {
    throw new Error(`body.semitones is not a whole number from 1 to ${MOST_SEMITONES}, up or down`);
  }
  return semitones;
}

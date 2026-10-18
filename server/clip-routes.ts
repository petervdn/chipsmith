/**
 * `/api/clips`: the pool listed, a clip's record changed (status, tags, a variation's label), and a
 * copy of its .fur opened in Furnace; each answers with the clip or the list.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ClipListing, ClipOpened } from '../shared/api.types.ts';
import { openClipInFurnace } from './clip-files.ts';
import { readJsonBody, sendError, sendJson } from './http.ts';
import { checkClipChange } from './model-checks.ts';
import type { Store } from './store.ts';
import { getSongsUsingClip, saveClip } from './store.ts';

/**
 * Answers a request to `/api/clips`, `/api/clips/<id>` or `/api/clips/<id>/open`.
 *
 * @param store - The clips and songs.
 * @param request - The request.
 * @param response - The response to answer on.
 * @param target - What the request is to.
 * @param target.id - The clip's id, or undefined for the pool.
 * @param target.file - What of the clip (`open`), or undefined.
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

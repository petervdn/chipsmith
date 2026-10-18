/**
 * `/api/clips`: the pool listed, a clip's record changed (status, tags, a variation's label), a copy
 * of its .fur opened in Furnace, and its notes for the note grid; a take of it made by transposing
 * it or from its notes as edited (docs/adr/0037), and a take deleted (docs/adr/0039).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ClipListing, ClipOpened, TakeDeleted, TakeMade } from '../shared/api.types.ts';
import { makeTransposedTake } from '../make/transpose-take.ts';
import { makeNotesTake, readClipNotes } from '../make/notes-take.ts';
import {
  clipChangeSchema,
  notesRequestSchema,
  takeDeletionRequestSchema,
  transposeRequestSchema,
} from '../shared/api-requests.schema.ts';
import { parseChecked } from '../shared/schema-parse.ts';
import { openClipInFurnace } from './clip-files.ts';
import { readJsonBody, sendError, sendJson } from './http.ts';
import type { Store } from './store.ts';
import { getSongsUsingClip, rescanStore, saveClip } from './store.ts';
import { getTakeDeletionProblem, replaceTake } from './take-deletion.ts';

/**
 * Answers a request to `/api/clips`, `/api/clips/<id>` (changed, or a take deleted),
 * `/api/clips/<id>/open`, `/api/clips/<id>/transpose` or `/api/clips/<id>/notes`.
 *
 * @param store - The clips and songs.
 * @param request - The request.
 * @param response - The response to answer on.
 * @param target - What the request is to.
 * @param target.id - The clip's id, or undefined for the pool.
 * @param target.file - What of the clip (`open`, `transpose`, `notes`), or undefined.
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
    const { song: songId, semitones } = parseChecked(
      transposeRequestSchema,
      await readJsonBody(request),
      'body',
    );
    if (!store.songs.has(songId)) return sendError(response, 400, `no song ${songId}`);
    const clipId = await makeTransposedTake({ root: store.root, parent: clip, songId, semitones });
    rescanStore(store);
    const made: TakeMade = { clipId };
    return sendJson(response, made);
  }
  if (file === 'notes' && method === 'GET') {
    const clip = store.clips.get(id);
    if (!clip) return sendError(response, 404, `no clip ${id}`);
    return sendJson(response, readClipNotes(store.root, clip));
  }
  if (file === 'notes' && method === 'POST') {
    const clip = store.clips.get(id);
    if (!clip) return sendError(response, 404, `no clip ${id}`);
    const {
      song: songId,
      channel,
      rows,
    } = parseChecked(notesRequestSchema, await readJsonBody(request), 'body');
    if (!store.songs.has(songId)) return sendError(response, 400, `no song ${songId}`);
    const clipId = await makeNotesTake({ root: store.root, parent: clip, songId, channel, rows });
    rescanStore(store);
    const made: TakeMade = { clipId };
    return sendJson(response, made);
  }
  if (!file && method === 'PATCH') {
    const clip = store.clips.get(id);
    if (!clip) return sendError(response, 404, `no clip ${id}`);
    const change = parseChecked(clipChangeSchema, await readJsonBody(request), 'body');
    if (change.variationLabel !== undefined && clip.parent?.relation !== 'variation') {
      return sendError(
        response,
        400,
        'body.variationLabel: is set, but the clip is not a variation',
      );
    }
    saveClip(store, { ...clip, ...change });
    return sendJson(response, { clip: store.clips.get(id), usedBy: getSongsUsingClip(store, id) });
  }
  if (!file && method === 'DELETE') {
    const { song: songId } = parseChecked(
      takeDeletionRequestSchema,
      await readJsonBody(request),
      'body',
    );
    const problem = getTakeDeletionProblem(store, id, songId);
    const parentId = store.clips.get(id)?.parent?.clip;
    if (problem || !parentId) return sendError(response, 409, problem ?? `no clip ${id}`);
    replaceTake(store, id, parentId);
    const deleted: TakeDeleted = { replacedBy: parentId };
    return sendJson(response, deleted);
  }
  sendError(response, 404, 'not found');
}

function listClips(store: Store): ClipListing[] {
  return [...store.clips.values()].map((clip) => ({
    clip,
    usedBy: getSongsUsingClip(store, clip.id),
  }));
}

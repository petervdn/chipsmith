/**
 * `/api/clips`: the pool listed, a clip's record changed (status, tags, a variation's label), a copy
 * of its .fur opened in Furnace, and its notes for the note grid; a take of it made by transposing
 * it or from its notes as edited (docs/adr/0037).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ClipListing, ClipOpened, TakeMade } from '../shared/api.types.ts';
import { makeTransposedTake } from '../make/transpose-take.ts';
import { getArray, getNumber, getObject, getString } from './json-checks.ts';
import { makeNotesTake, readClipNotes } from '../make/notes-take.ts';
import type { ChannelRow } from '../shared/clip-notes.schema.ts';
import { MACRO_RELEASE } from '../fur/notes.ts';
import { openClipInFurnace } from './clip-files.ts';
import { readJsonBody, sendError, sendJson } from './http.ts';
import { checkClipChange } from './model-checks.ts';
import type { Store } from './store.ts';
import { getSongsUsingClip, rescanStore, saveClip } from './store.ts';

/** The most semitones a transpose moves a clip, either way: two octaves. */
const MOST_SEMITONES = 24;
/** The highest note value a row holds: a macro release (fur/notes.ts). */
const MOST_NOTE = MACRO_RELEASE;
/** The most an instrument or a volume can be, a byte. */
const MOST_BYTE = 255;

/**
 * Answers a request to `/api/clips`, `/api/clips/<id>`, `/api/clips/<id>/open`,
 * `/api/clips/<id>/transpose` or `/api/clips/<id>/notes`.
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
    const body = getObject(await readJsonBody(request), 'body');
    const songId = getString(body['song'], 'body.song');
    if (!store.songs.has(songId)) return sendError(response, 400, `no song ${songId}`);
    const semitones = getSemitones(body['semitones']);
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
    const body = getObject(await readJsonBody(request), 'body');
    const songId = getString(body['song'], 'body.song');
    if (!store.songs.has(songId)) return sendError(response, 400, `no song ${songId}`);
    const channel = getNumber(body['channel'], 'body.channel');
    const rows = getArray(body['rows'], 'body.rows', checkChannelRow);
    const clipId = await makeNotesTake({ root: store.root, parent: clip, songId, channel, rows });
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

/**
 * Checks a row of a channel as the note grid sends it.
 *
 * @param value - The row, not yet checked.
 * @param path - Where it is, named in an error.
 * @returns The row.
 */
function checkChannelRow(value: unknown, path: string): ChannelRow {
  const row = getObject(value, path);
  return {
    row: getWholeNumber(row['row'], `${path}.row`, Infinity),
    note: row['note'] === null ? null : getWholeNumber(row['note'], `${path}.note`, MOST_NOTE),
    instrument:
      row['instrument'] === null
        ? null
        : getWholeNumber(row['instrument'], `${path}.instrument`, MOST_BYTE),
    volume:
      row['volume'] === null ? null : getWholeNumber(row['volume'], `${path}.volume`, MOST_BYTE),
  };
}

/**
 * Checks a whole number from 0 to a most.
 *
 * @param value - The value, not yet checked.
 * @param path - Where it is, named in an error.
 * @param most - The most it may be.
 * @returns The number.
 */
function getWholeNumber(value: unknown, path: string, most: number): number {
  const number = getNumber(value, path);
  if (!Number.isInteger(number) || number < 0 || number > most) {
    throw new Error(`${path}: not a whole number from 0 to ${most}`);
  }
  return number;
}

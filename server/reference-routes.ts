/**
 * `/api/references` (the references listed, one's notes changed) and `/media/references/<id>/…`
 * (its mix, `audio.flac`, and a channel alone, `channels/<nn>.flac`, with byte ranges).
 */
import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { readJsonBody, sendError, sendFile, sendJson } from './http.ts';
import { getObject, getString } from './json-checks.ts';
import type { ReferenceStore } from './references.ts';
import { getReferenceFolder, listReferences, saveReferenceNotes } from './references.ts';

/** A channel's audio file: its number, two digits or more. */
const CHANNEL_FILE = /^\d{2,}\.flac$/;

/**
 * Answers a request to `/api/references…` or `/media/references/…`.
 *
 * @param references - The references in memory.
 * @param request - The request.
 * @param response - The response to answer on.
 * @param target - What the request is to.
 * @param target.area - `api` or `media`.
 * @param target.id - The reference's id, or undefined for the list.
 * @param target.rest - The parts of the path after the id.
 * @param target.method - The request's method.
 * @returns A promise that settles when the answer is sent.
 */
export async function routeReferences(
  references: ReferenceStore,
  request: IncomingMessage,
  response: ServerResponse,
  {
    area,
    id,
    rest,
    method,
  }: { area: string; id: string | undefined; rest: string[]; method: string },
): Promise<void> {
  if (area === 'media' && id && references.references.has(id)) {
    const [first, second] = rest;
    const isMix = rest.length === 1 && first === 'audio.flac';
    const isChannel = rest.length === 2 && first === 'channels' && CHANNEL_FILE.test(second ?? '');
    const file = join(getReferenceFolder(references, id), ...rest);
    if (!(isMix || isChannel) || !existsSync(file)) return sendError(response, 404, 'not found');
    return sendFile(request, response, file, 'audio/flac');
  }
  if (area !== 'api' || rest.length > 0) return sendError(response, 404, 'not found');
  if (!id && method === 'GET') return sendJson(response, listReferences(references));
  if (id && method === 'PATCH') {
    const notes = getString(getObject(await readJsonBody(request), 'body')['notes'], 'body.notes');
    return sendJson(response, saveReferenceNotes(references, id, notes));
  }
  sendError(response, 404, 'not found');
}

/**
 * `/api/structures`: the saved structures listed, one made, changed or deleted; each answers with
 * the list. The presets are the page's own (shared/structure-presets.ts) and not served here.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, sendError, sendJson } from './http.ts';
import { checkStructureDraft } from './structure-checks.ts';
import type { StructureStore } from './structures.ts';
import { createStructure, deleteStructure, listStructures, updateStructure } from './structures.ts';

/**
 * Answers a request to `/api/structures` or `/api/structures/<id>`.
 *
 * @param structures - The structures in memory.
 * @param request - The request.
 * @param response - The response to answer on.
 * @param target - What the request is to.
 * @param target.id - The structure's id, or undefined for the list.
 * @param target.method - The request's method.
 * @returns A promise that settles when the answer is sent.
 */
export async function routeStructures(
  structures: StructureStore,
  request: IncomingMessage,
  response: ServerResponse,
  { id, method }: { id: string | undefined; method: string },
): Promise<void> {
  if (!id && method === 'POST') {
    createStructure(structures, checkStructureDraft(await readJsonBody(request), 'body'));
  } else if (id && method === 'PATCH') {
    updateStructure(structures, id, checkStructureDraft(await readJsonBody(request), 'body'));
  } else if (id && method === 'DELETE') {
    deleteStructure(structures, id);
  } else if (id || method !== 'GET') {
    return sendError(response, 404, 'not found');
  }
  sendJson(response, listStructures(structures));
}

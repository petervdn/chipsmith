/** `/api/settings`: the app's settings read, or changed; each answers with the settings as they are. */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { appSettingsChangeSchema } from '../shared/api-requests.schema.ts';
import { parseChecked } from '../shared/schema-parse.ts';
import { changeAppSettings, getAppSettings } from './app-settings.ts';
import { readJsonBody, sendError, sendJson } from './http.ts';

/**
 * Answers a request to `/api/settings`.
 *
 * @param root - The data folder, which holds the settings.
 * @param request - The request.
 * @param response - The response to answer on.
 * @param method - The request's method.
 * @returns A promise that settles when the answer is sent.
 */
export async function routeAppSettings(
  root: string,
  request: IncomingMessage,
  response: ServerResponse,
  method: string,
): Promise<void> {
  if (method === 'GET') return sendJson(response, getAppSettings(root));
  if (method === 'PATCH') {
    const change = parseChecked(appSettingsChangeSchema, await readJsonBody(request), 'body');
    return sendJson(response, changeAppSettings(root, change));
  }
  return sendError(response, 405, `${method} is not answered here`);
}

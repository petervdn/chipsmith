/**
 * Asking the app's server (server/api.ts): a route read as JSON, or a change sent, with the server's
 * `{ error }` as the error. Used by the queries and mutations beside it; knows nothing of React.
 */

/**
 * Reads a route, or sends to it, and gives the server's answer. An answer that is not OK is thrown
 * as an error with the server's `{ error }`, or the status text when it has none.
 *
 * @param path - The route.
 * @param init - The request's method, headers and body; a GET when left out.
 * @returns The server's answer, read as JSON.
 */
export async function requestJson<Answer>(path: string, init?: RequestInit): Promise<Answer> {
  const response = await fetch(path, init);
  const answer: unknown = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(answer, response));
  return asAnswer<Answer>(answer);
}

/**
 * Returns what went wrong, from an answer that is not OK.
 *
 * @param answer - The server's answer, read as JSON, or null when it was not JSON.
 * @param response - The response.
 * @returns The server's `{ error }`, or the status text when it has none.
 */
export function getErrorMessage(answer: unknown, response: Response): string {
  return typeof answer === 'object' && answer !== null && 'error' in answer
    ? String(answer.error)
    : response.statusText;
}

/**
 * Sends JSON to a route with a method.
 *
 * @param path - The route.
 * @param method - The method.
 * @param body - What is sent, written as JSON.
 * @returns The server's answer, read as JSON.
 */
export function sendJson<Answer>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body: unknown,
): Promise<Answer> {
  return requestJson<Answer>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Gives the server's answer the route's type, which it has by contract (shared/api.types.ts).
 *
 * @param answer - The server's answer, read as JSON.
 * @returns The same answer, typed.
 */
function asAnswer<Answer>(answer: unknown): Answer {
  // eslint-disable-next-line typescript/consistent-type-assertions -- the server's answers are typed by shared/api.types.ts and the server parses what comes in (docs/adr/0038); checking each answer again would repeat it
  return answer as Answer;
}

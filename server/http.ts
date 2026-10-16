/**
 * Answering a request: JSON, an error, a file with byte ranges (a browser seeks in audio by asking
 * for ranges), and reading a JSON body. Knows nothing of clips or songs.
 */
import { createReadStream, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

/** Sends a value as JSON. */
export function sendJson(response: ServerResponse, value: unknown, status = 200): void {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

/** Sends an error as `{ error }`. */
export function sendError(response: ServerResponse, status: number, message: string): void {
  sendJson(response, { error: message }, status);
}

/** Reads a request's body as JSON, not yet checked. */
export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : null;
}

/** Sends a file, or the byte range the request asks for. */
export function sendFile(
  request: IncomingMessage,
  response: ServerResponse,
  file: string,
  contentType: string,
): void {
  const size = statSync(file).size;
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '');
  let start = 0;
  let end = size - 1;
  let status = 200;
  const headers: Record<string, string | number> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  };
  const [, rangeStart = '', rangeEnd = ''] = range ?? [];
  if (rangeStart || rangeEnd) {
    if (rangeStart) {
      start = Number(rangeStart);
      end = rangeEnd ? Math.min(Number(rangeEnd), size - 1) : size - 1;
    } else {
      start = Math.max(0, size - Number(rangeEnd));
    }
    if (start > end) {
      response.writeHead(416, { 'Content-Range': `bytes */${size}` });
      response.end();
      return;
    }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length'] = end - start + 1;
  response.writeHead(status, headers);
  createReadStream(file, { start, end })
    .on('error', () => response.destroy())
    .pipe(response);
}

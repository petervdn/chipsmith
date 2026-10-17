/**
 * A clip's .fur file given out to look at: downloaded, as tracker text, or opened in the Furnace
 * app on this computer. Furnace opens a copy in the system's temporary folder, so saving there
 * never changes the clip (a clip never changes, docs/adr/0004). Knows nothing of the page.
 */
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getSettings } from '../config/settings.ts';
import { getChannelName } from '../shared/clip-channels.ts';
import { getClipLabel } from '../shared/clip-label.ts';
import type { Clip } from '../shared/clip.types.ts';
import { readFurFile } from '../fur/read.ts';
import { getTrackerText } from '../fur/tracker-text.ts';
import { sendError, sendFile, sendText } from './http.ts';
import type { Store } from './store.ts';
import { getClipFolder } from './store.ts';

/** The folder in the system's temporary folder where Furnace opens its copies. */
const OPEN_FOLDER = join(tmpdir(), 'chipsmith');

/**
 * Sends a clip's .fur file as a download, named after the clip.
 *
 * @param store - The clips and songs in memory.
 * @param request - The request, for a byte range.
 * @param response - The response.
 * @param clipId - The clip.
 */
export function sendClipFur(
  store: Store,
  request: IncomingMessage,
  response: ServerResponse,
  clipId: string,
): void {
  const clip = store.clips.get(clipId);
  const file = join(getClipFolder(store, clipId), 'source.fur');
  if (!clip || !existsSync(file)) {
    sendError(response, 404, `no .fur for ${clipId}`);
    return;
  }
  sendFile(request, response, file, 'application/octet-stream', getFurName(clip));
}

/**
 * Sends a clip's .fur file as tracker text.
 *
 * @param store - The clips and songs in memory.
 * @param response - The response.
 * @param clipId - The clip.
 */
export function sendClipText(store: Store, response: ServerResponse, clipId: string): void {
  const clip = store.clips.get(clipId);
  const file = join(getClipFolder(store, clipId), 'source.fur');
  if (!clip || !existsSync(file)) {
    sendError(response, 404, `no .fur for ${clipId}`);
    return;
  }
  const furFile = readFurFile(readFileSync(file));
  const names = Array.from({ length: furFile.song.channelCount }, (_unused, channel) =>
    getChannelName(clip.chips, channel),
  );
  sendText(response, `${clip.id} ${getClipLabel(clip)}\n\n${getTrackerText(furFile, names)}`);
}

/**
 * Opens a copy of a clip's .fur file in the Furnace app, detached from the server.
 *
 * @param store - The clips and songs in memory.
 * @param clipId - The clip.
 * @returns The copy opened, or null when the clip has no .fur file.
 */
export function openClipInFurnace(store: Store, clipId: string): string | null {
  const clip = store.clips.get(clipId);
  const file = join(getClipFolder(store, clipId), 'source.fur');
  if (!clip || !existsSync(file)) return null;
  mkdirSync(OPEN_FOLDER, { recursive: true });
  const copy = join(OPEN_FOLDER, getFurName(clip));
  copyFileSync(file, copy);
  const furnace = spawn(getSettings().furnace, [copy], { detached: true, stdio: 'ignore' });
  furnace.on('error', (error) => console.error(`Furnace did not open ${copy}: ${error.message}`));
  furnace.unref();
  return copy;
}

/**
 * Returns the file name a clip's .fur is given out as: its id and name, safe for any file system.
 *
 * @param clip - The clip.
 * @returns The file name, like `c0123 Lead.fur`.
 */
function getFurName(clip: Clip): string {
  return `${clip.id} ${getClipLabel(clip)}`.replace(/[^\w .·-]+/g, '_') + '.fur';
}

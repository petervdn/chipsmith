/**
 * The Vite plugin that is the app's server: it opens the store when Vite starts and answers
 * `/api/…` and `/media/…`. Each route reads what it is asked, checks a body where it comes in, and
 * hands the work to the store.
 */
import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import type { CatalogueChange, ClipListing, SongDetail, SongListing } from '../shared/api.types.ts';
import type { Clip } from '../shared/clip.types.ts';
import { getSongSeconds } from '../shared/song-length.ts';
import { sendError, sendFile, sendJson, readJsonBody } from './http.ts';
import { getObject } from './json-checks.ts';
import { checkStatus, checkTags } from './model-checks.ts';
import type { Store } from './store.ts';
import { getClipFolder, getSongsUsingClip, openStore, saveClip, saveSong } from './store.ts';

/** The plugin, serving the clips and songs under `root`. */
export function chiptuneServer(root: string): Plugin {
  return {
    name: 'chiptune-server',
    configureServer(server) {
      const store = openStore(root);
      for (const { file, error } of store.unreadable) console.warn(`unreadable ${file}: ${error}`);
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? '').split('?')[0] ?? '';
        if (!path.startsWith('/api/') && !path.startsWith('/media/')) {
          next();
          return;
        }
        route(store, request, response, path).catch((error: unknown) => {
          sendError(response, 400, error instanceof Error ? error.message : String(error));
        });
      });
    },
  };
}

async function route(
  store: Store,
  request: IncomingMessage,
  response: ServerResponse,
  path: string,
): Promise<void> {
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const [area, kind, id, file] = parts;
  const method = request.method ?? 'GET';
  if (area === 'media' && kind === 'clips' && id && file === 'audio.flac' && parts.length === 4) {
    sendClipAudio(store, request, response, id);
    return;
  }
  if (area !== 'api') return sendError(response, 404, 'not found');
  if (kind === 'songs' && !id && method === 'GET') return sendJson(response, listSongs(store));
  if (kind === 'clips' && !id && method === 'GET') return sendJson(response, listClips(store));
  if (kind === 'songs' && id && method === 'GET') {
    return sendJson(response, getSongDetail(store, id));
  }
  if (kind === 'songs' && id && method === 'PATCH') {
    const song = store.songs.get(id);
    if (!song) return sendError(response, 404, `no song ${id}`);
    const change = checkCatalogueChange(await readJsonBody(request));
    saveSong(store, { ...song, ...change, updated: new Date().toISOString() });
    return sendJson(response, getSongDetail(store, id));
  }
  if (kind === 'clips' && id && method === 'PATCH') {
    const clip = store.clips.get(id);
    if (!clip) return sendError(response, 404, `no clip ${id}`);
    saveClip(store, { ...clip, ...checkCatalogueChange(await readJsonBody(request)) });
    return sendJson(response, { clip: store.clips.get(id), usedBy: getSongsUsingClip(store, id) });
  }
  sendError(response, 404, 'not found');
}

function listSongs(store: Store): SongListing[] {
  return [...store.songs.values()].map((song) => ({
    song,
    seconds: getSongSeconds(song, (clipId) => store.clips.get(clipId)?.seconds ?? 0),
    clipCount: new Set(song.tracks.flatMap((track) => track.blocks.map((block) => block.clip)))
      .size,
  }));
}

function listClips(store: Store): ClipListing[] {
  return [...store.clips.values()].map((clip) => ({
    clip,
    usedBy: getSongsUsingClip(store, clip.id),
  }));
}

function getSongDetail(store: Store, songId: string): SongDetail {
  const song = store.songs.get(songId);
  if (!song) throw new Error(`no song ${songId}`);
  const clipIds = new Set(song.tracks.flatMap((track) => track.blocks.map((block) => block.clip)));
  const clips = [...clipIds].flatMap((clipId): Clip[] => {
    const clip = store.clips.get(clipId);
    return clip ? [clip] : [];
  });
  return { song, clips };
}

function checkCatalogueChange(body: unknown): CatalogueChange {
  const change = getObject(body, 'body');
  const result: CatalogueChange = {};
  if (change['status'] !== undefined) result.status = checkStatus(change['status'], 'body.status');
  if (change['tags'] !== undefined) result.tags = checkTags(change['tags'], 'body.tags');
  return result;
}

function sendClipAudio(
  store: Store,
  request: IncomingMessage,
  response: ServerResponse,
  clipId: string,
): void {
  const file = join(getClipFolder(store, clipId), 'audio.flac');
  if (!store.clips.has(clipId) || !existsSync(file)) {
    sendError(response, 404, `no audio for ${clipId}`);
    return;
  }
  sendFile(request, response, file, 'audio/flac');
}

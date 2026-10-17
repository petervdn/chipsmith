/**
 * The Vite plugin that is the app's server: it opens the store when Vite starts and answers
 * `/api/…` and `/media/…`. Each route reads what it is asked, checks a body where it comes in, and
 * hands the work to the store.
 */
import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import type {
  CatalogueChange,
  ClipListing,
  ProgramCheck,
  SongDetail,
  SongListing,
} from '../shared/api.types.ts';
import { checkPrograms } from '../config/programs.ts';
import { PROJECT_FOLDER, getSettings } from '../config/settings.ts';
import type { Clip } from '../shared/clip.types.ts';
import type { Song } from '../shared/song.types.ts';
import { getSongSeconds } from '../shared/song-length.ts';
import { sendError, sendFile, sendJson, readJsonBody } from './http.ts';
import type { Job } from '../shared/job.types.ts';
import { getObject, getString, getStringOrNull } from './json-checks.ts';
import { startJobRunner } from './job-runner.ts';
import type { JobStore } from './jobs.ts';
import { createJob, openJobs } from './jobs.ts';
import { copyExamplesIfEmpty } from './examples.ts';
import { isAudioMissing, renderMissingAudio } from './missing-audio.ts';
import { checkStatus, checkTags } from './model-checks.ts';
import type { Store } from './store.ts';
import {
  getClipFolder,
  getSongsUsingClip,
  openStore,
  rescanStore,
  saveClip,
  saveSong,
} from './store.ts';

/** Checks the programs the app calls, and says in the server's log which cannot be used. */
function checkProgramsAndWarn(): Promise<ProgramCheck[]> {
  const checks = checkPrograms(getSettings());
  void checks.then((results) => {
    for (const { name, path, error, neededFor } of results) {
      if (error) console.warn(`${name} (${path}) cannot be used for ${neededFor}: ${error}`);
    }
  });
  return checks;
}

/** The example songs, copied into an empty data folder. */
const EXAMPLES_FOLDER = join(PROJECT_FOLDER, 'examples');

declare global {
  /** Stops the job runner of the server before a restart, so only one runs. */
  var chiptuneStopJobRunner: (() => void) | undefined;
  /** The rendering of missing audio, while it runs: a restart of the server does not start another. */
  var chiptuneRenderingMissingAudio: Promise<void> | undefined;
}

/** Renders the missing audio in the background, unless that is running already. */
function startRenderingMissingAudio(store: Store): void {
  if (globalThis.chiptuneRenderingMissingAudio) return;
  globalThis.chiptuneRenderingMissingAudio = renderMissingAudio(store).finally(() => {
    globalThis.chiptuneRenderingMissingAudio = undefined;
  });
}

/** The plugin, serving the clips and songs under `root`. */
export function chiptuneServer(root: string): Plugin {
  return {
    name: 'chiptune-server',
    configureServer(server) {
      if (copyExamplesIfEmpty(root, EXAMPLES_FOLDER)) {
        console.log(`the examples copied into ${root}`);
      }
      const store = openStore(root);
      for (const { file, error } of store.unreadable) console.warn(`unreadable ${file}: ${error}`);
      startRenderingMissingAudio(store);
      const jobs = openJobs(root);
      let programChecks = checkProgramsAndWarn();
      // one runner: a restart of the server (Vite restarts it when a server file changes) replaces it
      globalThis.chiptuneStopJobRunner?.();
      globalThis.chiptuneStopJobRunner = startJobRunner(jobs, store);
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? '').split('?')[0] ?? '';
        if (!path.startsWith('/api/') && !path.startsWith('/media/')) {
          next();
          return;
        }
        if (path === '/api/programs') {
          if (request.method === 'POST') programChecks = checkProgramsAndWarn();
          programChecks.then(
            (checks) => sendJson(response, checks),
            (error: unknown) => sendError(response, 500, String(error)),
          );
          return;
        }
        route(store, jobs, request, response, path).catch((error: unknown) => {
          sendError(response, 400, error instanceof Error ? error.message : String(error));
        });
      });
    },
  };
}

async function route(
  store: Store,
  jobs: JobStore,
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
  if (kind === 'jobs' && !id && method === 'GET') return sendJson(response, listJobs(jobs));
  if (kind === 'jobs' && !id && method === 'POST') {
    const body = getObject(await readJsonBody(request), 'body');
    const prompt = getString(body['prompt'], 'body.prompt').trim();
    if (!prompt) return sendError(response, 400, 'the prompt is empty');
    const fromSong = getStringOrNull(body['fromSong'] ?? null, 'body.fromSong');
    const song = fromSong ? store.songs.get(fromSong) : null;
    if (fromSong && !song) return sendError(response, 400, `no song ${fromSong}`);
    return sendJson(response, createJob(jobs, prompt, song ? song.id : null));
  }
  if (kind === 'rescan' && method === 'POST') {
    rescanStore(store);
    return sendJson(response, { songs: store.songs.size, clips: store.clips.size });
  }
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

/** The jobs, newest first: those not finished, and the finished ones of the last hour. */
function listJobs(jobs: JobStore): Job[] {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  return [...jobs.jobs.values()]
    .filter((job) => !job.finished || job.finished > hourAgo)
    .sort((first, second) => second.created.localeCompare(first.created));
}

function listSongs(store: Store): SongListing[] {
  const songs = [...store.songs.values()];
  return songs.map((song) => {
    const clips = getSongClips(store, song);
    return {
      song,
      seconds: getSongSeconds(song, (clipId) => store.clips.get(clipId)?.seconds ?? 0),
      clipCount: clips.length,
      isWaitingForAudio: clips.some((clip) => isAudioMissing(store, clip.id)),
      isChangedAfterPrompt: clips.some((clip) => clip.prompt !== song.prompt),
      key: clips.find((clip) => clip.key)?.key ?? null,
      chips: [...new Set(clips.flatMap((clip) => clip.chips))],
      promptedAgainAs: songs
        .filter((other) => other.promptedFrom === song.id)
        .map((other) => other.id),
    };
  });
}

/** The clips a song's blocks play, each once, in the order the song first plays them. */
function getSongClips(store: Store, song: Song): Clip[] {
  const clipIds = new Set(
    song.tracks
      .flatMap((track) => track.blocks)
      .sort((first, second) => first.start - second.start)
      .map((block) => block.clip),
  );
  return [...clipIds].flatMap((clipId) => {
    const clip = store.clips.get(clipId);
    return clip ? [clip] : [];
  });
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
  return { song, clips, isWaitingForAudio: clips.some((clip) => isAudioMissing(store, clip.id)) };
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

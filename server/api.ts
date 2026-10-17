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
import { getArray, getObject, getString, getStringOrNull } from './json-checks.ts';
import { startJobRunner } from './job-runner.ts';
import type { JobStore } from './jobs.ts';
import { createJob, listJobs, openJobs, removeJob } from './jobs.ts';
import { copyExamplesIfEmpty } from './examples.ts';
import { splitSong } from '../make/split-song.ts';
import { isAudioMissing, renderMissingAudio } from './missing-audio.ts';
import { checkGuideDraft, checkStatus, checkTags, checkTracks } from './model-checks.ts';
import type { GuideStore } from './guides.ts';
import {
  createGuide,
  deleteGuide,
  getSentGuides,
  listGuides,
  openGuides,
  updateGuide,
} from './guides.ts';
import type { Store } from './store.ts';
import {
  getClipFolder,
  getSongsUsingClip,
  openStore,
  rescanStore,
  saveClip,
  saveSong,
} from './store.ts';
import { checkSentStructure } from './structure-checks.ts';
import { routeStructures } from './structure-routes.ts';
import type { StructureStore } from './structures.ts';
import { openStructures } from './structures.ts';

/**
 * Checks the programs the app calls, and warns in the server's log of each one that cannot be used.
 *
 * @returns The checks of the programs, once they are done.
 */
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

/**
 * Starts rendering the missing audio in the background, unless that is running already.
 *
 * @param store - The clips and songs whose missing audio is rendered.
 */
function startRenderingMissingAudio(store: Store): void {
  if (globalThis.chiptuneRenderingMissingAudio) return;
  globalThis.chiptuneRenderingMissingAudio = renderMissingAudio(store).finally(() => {
    globalThis.chiptuneRenderingMissingAudio = undefined;
  });
}

/**
 * Returns the Vite plugin that serves the app's clips, songs, jobs and guides.
 *
 * @param root - The data folder the clips and songs are in.
 * @returns The plugin.
 */
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
      const guides = openGuides(root);
      const structures = openStructures(root);
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
        route({ store, jobs, guides, structures }, request, response, path).catch(
          (error: unknown) => {
            sendError(response, 400, error instanceof Error ? error.message : String(error));
          },
        );
      });
    },
  };
}

/** What the routes read and change: the clips and songs, the jobs, the guides. */
type Stores = {
  store: Store;
  jobs: JobStore;
  guides: GuideStore;
  structures: StructureStore;
};

async function route(
  { store, jobs, guides, structures }: Stores,
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
  if (kind === 'jobs' && id && method === 'DELETE') {
    if (!jobs.jobs.has(id)) return sendError(response, 404, `no job ${id}`);
    removeJob(jobs, id);
    return sendJson(response, listJobs(jobs));
  }
  if (kind === 'jobs' && !id && method === 'POST') {
    const body = getObject(await readJsonBody(request), 'body');
    const prompt = getString(body['prompt'], 'body.prompt').trim();
    if (!prompt) return sendError(response, 400, 'the prompt is empty');
    const fromSong = getStringOrNull(body['fromSong'] ?? null, 'body.fromSong');
    const song = fromSong ? store.songs.get(fromSong) : null;
    if (fromSong && !song) return sendError(response, 400, `no song ${fromSong}`);
    const guideIds = getArray(body['guideIds'] ?? [], 'body.guideIds', getString);
    const sent = getSentGuides(guides, guideIds);
    const structure = checkSentStructure(body['structure'], 'body.structure');
    return sendJson(response, createJob(jobs, prompt, sent, song ? song.id : null, structure));
  }
  if (kind === 'guides') return routeGuides(guides, request, response, { id, method });
  if (kind === 'structures') {
    return routeStructures(structures, request, response, { id, method });
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
  if (kind === 'songs' && id && file === 'tracks' && method === 'PUT') {
    const song = store.songs.get(id);
    if (!song) return sendError(response, 404, `no song ${id}`);
    const tracks = checkTracks(getObject(await readJsonBody(request), 'body')['tracks'], 'tracks');
    const unknown = tracks
      .flatMap((track) => track.blocks)
      .find((block) => !store.clips.has(block.clip));
    if (unknown) return sendError(response, 400, `no clip ${unknown.clip}`);
    saveSong(store, { ...song, tracks, updated: new Date().toISOString() });
    return sendJson(response, getSongDetail(store, id));
  }
  if (kind === 'songs' && id && file === 'split' && method === 'POST') {
    const song = store.songs.get(id);
    if (!song) return sendError(response, 404, `no song ${id}`);
    const whole = getWholeClip(store, song);
    if (!whole) return sendError(response, 400, 'only a song that is one whole clip can be split');
    const { tracks } = splitSong(store.root, song, whole);
    rescanStore(store);
    saveSong(store, { ...song, tracks, updated: new Date().toISOString() });
    startRenderingMissingAudio(store);
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

/**
 * Answers `/api/guides`: lists the guides, makes a new one, or changes or deletes one, and answers
 * each with the list of guides.
 *
 * @param guides - The style guides.
 * @param request - The request.
 * @param response - The response to answer it on.
 * @param target - What the request is for.
 * @param target.id - The guide's id, or undefined for the list.
 * @param target.method - The request's HTTP method.
 * @returns A promise that settles when the answer is sent.
 */
async function routeGuides(
  guides: GuideStore,
  request: IncomingMessage,
  response: ServerResponse,
  { id, method }: { id: string | undefined; method: string },
): Promise<void> {
  if (!id && method === 'POST') {
    createGuide(guides, checkGuideDraft(await readJsonBody(request), 'body'));
  } else if (id && method === 'PATCH') {
    updateGuide(guides, id, checkGuideDraft(await readJsonBody(request), 'body'));
  } else if (id && method === 'DELETE') {
    deleteGuide(guides, id);
  } else if (id || method !== 'GET') {
    return sendError(response, 404, 'not found');
  }
  sendJson(response, listGuides(guides));
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

/**
 * Returns the clips a song's blocks play, each once, in the order the song first plays them.
 *
 * @param store - The clips and songs.
 * @param song - The song.
 * @returns The clips; a clip the store does not have is left out.
 */
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
  const waitingClipIds = clips
    .filter((clip) => isAudioMissing(store, clip.id))
    .map((clip) => clip.id);
  return { song, clips, isWaitingForAudio: waitingClipIds.length > 0, waitingClipIds };
}

/**
 * Returns the clip a song plays when it is one whole clip: one track, one block, from the start,
 * untrimmed and played once, its clip every channel of all its bars, with its source.
 *
 * @param store - The clips and songs in memory.
 * @param song - The song.
 * @returns The whole clip, or null when the song is not one.
 */
function getWholeClip(store: Store, song: Song): Clip | null {
  const [track, ...otherTracks] = song.tracks;
  const [block, ...otherBlocks] = track?.blocks ?? [];
  if (!block || otherTracks.length > 0 || otherBlocks.length > 0) return null;
  if (block.start !== 0 || block.trim !== null || block.repeats !== 1) return null;
  const clip = store.clips.get(block.clip);
  if (!clip || clip.channels !== null || clip.bars !== null) return null;
  return existsSync(join(getClipFolder(store, clip.id), 'source.fur')) ? clip : null;
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

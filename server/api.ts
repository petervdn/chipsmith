/**
 * The Vite plugin that is the app's server: it opens the store when Vite starts and answers
 * `/api/…` and `/media/…`. Each route reads what it is asked, checks a body where it comes in, and
 * hands the work to the store.
 */
import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import type { ProgramCheck, SongDeletion, SongDetail, SongListing } from '../shared/api.types.ts';
import { checkPrograms } from '../config/programs.ts';
import { PROJECT_FOLDER, getSettings } from '../config/settings.ts';
import type { Clip } from '../shared/clip.schema.ts';
import type { Song } from '../shared/song.schema.ts';
import { getSongSeconds } from '../shared/song-length.ts';
import { readBody, readJsonBody, sendBytes, sendError, sendFile, sendJson } from './http.ts';
import { startJobRunner } from './job-runner.ts';
import type { JobStore } from './jobs.ts';
import { openJobs } from './jobs.ts';
import { copyExamplesIfEmpty } from './examples.ts';
import { splitSong } from '../make/split-song.ts';
import { isAudioMissing, renderMissingAudio } from './missing-audio.ts';
import { catalogueChangeSchema, tracksChangeSchema } from '../shared/api-requests.schema.ts';
import { guideDraftSchema } from '../shared/guide.schema.ts';
import { parseChecked } from '../shared/schema-parse.ts';
import type { GuideStore } from './guides.ts';
import { createGuide, deleteGuide, listGuides, openGuides, updateGuide } from './guides.ts';
import type { Store } from './store.ts';
import { deleteSong, getClipFolder, openStore, rescanStore, saveSong } from './store.ts';
import { routeStructures } from './structure-routes.ts';
import { routeJobs } from './job-routes.ts';
import type { StructureStore } from './structures.ts';
import { openStructures } from './structures.ts';
import { getSplitCount } from '../shared/clip-channels.ts';
import { hasVariationInLineage } from '../shared/clip-lineage.ts';
import { sendClipFur, sendClipText } from './clip-files.ts';
import { routeClips } from './clip-routes.ts';
import { getExportFormat } from '../shared/audio-export.ts';
import { encodeExport } from '../render/encode-export.ts';
import { getWavFacts } from '../render/wav.ts';

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
  /**
   * The stores of this process. Vite restarts the server in the same process when a server file
   * changes, and work under way (a song rendering) goes on there: it must change the stores the
   * restarted server serves, not copies.
   */
  var chiptuneStores: Stores | undefined;
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
      const isFirstStart = globalThis.chiptuneStores === undefined;
      const stores = (globalThis.chiptuneStores ??= {
        store: openStore(root),
        jobs: openJobs(root),
        guides: openGuides(root),
        structures: openStructures(root),
      });
      const { store, jobs, guides, structures } = stores;
      if (isFirstStart) {
        for (const { file, error } of store.unreadable) {
          console.warn(`unreadable ${file}: ${error}`);
        }
      }
      startRenderingMissingAudio(store);
      let programChecks = checkProgramsAndWarn();
      // one runner: a restart of the server replaces it; only a new process resumes the jobs that
      // were building or rendering, as in the same process that work is still going on
      globalThis.chiptuneStopJobRunner?.();
      globalThis.chiptuneStopJobRunner = startJobRunner(jobs, store, isFirstStart);
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
  if (area === 'media' && kind === 'clips' && id && file === 'source.fur' && parts.length === 4) {
    return sendClipFur(store, request, response, id);
  }
  if (area === 'media' && kind === 'clips' && id && file === 'source.txt' && parts.length === 4) {
    return sendClipText(store, response, id);
  }
  if (area !== 'api') return sendError(response, 404, 'not found');
  if (kind === 'jobs') {
    return routeJobs({ store, jobs, guides }, request, response, { id, file, method });
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
  if (kind === 'songs' && id && method === 'GET') {
    return sendJson(response, getSongDetail(store, id));
  }
  if (kind === 'songs' && id && method === 'PATCH') {
    const song = store.songs.get(id);
    if (!song) return sendError(response, 404, `no song ${id}`);
    const change = parseChecked(catalogueChangeSchema, await readJsonBody(request), 'body');
    saveSong(store, { ...song, ...change, updated: new Date().toISOString() });
    return sendJson(response, getSongDetail(store, id));
  }
  if (kind === 'songs' && id && !file && method === 'DELETE') {
    if (!store.songs.has(id)) return sendError(response, 404, `no song ${id}`);
    const deletion: SongDeletion = { clipIds: deleteSong(store, id) };
    return sendJson(response, deletion);
  }
  if (kind === 'songs' && id && file === 'tracks' && method === 'PUT') {
    const song = store.songs.get(id);
    if (!song) return sendError(response, 404, `no song ${id}`);
    const { tracks } = parseChecked(tracksChangeSchema, await readJsonBody(request), 'body');
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
    if (!whole) {
      const reason = 'only a song that is one whole clip of more than one channel can be split';
      return sendError(response, 400, reason);
    }
    const { tracks } = splitSong(store.root, song, whole);
    rescanStore(store);
    saveSong(store, { ...song, tracks, updated: new Date().toISOString() });
    startRenderingMissingAudio(store);
    return sendJson(response, getSongDetail(store, id));
  }
  if (kind === 'clips') return routeClips(store, request, response, { id, file, method });
  if (kind === 'encode' && id && method === 'POST') return encodeMix(request, response, id);
  sendError(response, 404, 'not found');
}

/**
 * Answers `POST /api/encode/<type>`: the WAV in the body, a song's mix the page rendered, encoded
 * to an export file type and sent back.
 *
 * @param request - The request, its body the WAV.
 * @param response - The response to send the encoded file on.
 * @param formatName - The name of the file type to encode to (`flac`, `mp3`).
 */
async function encodeMix(
  request: IncomingMessage,
  response: ServerResponse,
  formatName: string,
): Promise<void> {
  const format = getExportFormat(formatName);
  if (!format || format.ffmpegArgs.length === 0) {
    sendError(response, 400, `no export to ${formatName}`);
    return;
  }
  const wav = await readBody(request);
  try {
    getWavFacts(wav);
  } catch (error) {
    sendError(response, 400, error instanceof Error ? error.message : String(error));
    return;
  }
  sendBytes(response, await encodeExport(wav, format), format.mediaType);
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
    createGuide(guides, parseChecked(guideDraftSchema, await readJsonBody(request), 'body'));
  } else if (id && method === 'PATCH') {
    updateGuide(guides, id, parseChecked(guideDraftSchema, await readJsonBody(request), 'body'));
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
      isChangedAfterPrompt: clips.some((clip) =>
        hasVariationInLineage(clip, (clipId) => store.clips.get(clipId)),
      ),
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
 * Returns the clip a song plays when it can be split: one track, one block, from the start,
 * untrimmed and played once, its clip whole with more than one channel playing, with its source.
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
  if (!clip || getSplitCount(clip) === 0) return null;
  return existsSync(join(getClipFolder(store, clip.id), 'source.fur')) ? clip : null;
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

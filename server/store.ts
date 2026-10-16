/**
 * The clips and songs in memory: read from `clips/<id>/clip.json` and `songs/<id>/song.json` when the
 * server starts, and every change written back to its file before the copy in memory changes. The
 * files are the data; this is only a copy of them (docs/adr/0006). Knows nothing of HTTP.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type { Clip } from '../shared/clip.types.ts';
import type { Song } from '../shared/song.types.ts';
import { checkClip, checkSong } from './model-checks.ts';

/** The data folder's copy in memory, and the files that could not be read. */
export type Store = {
  root: string;
  clips: Map<string, Clip>;
  songs: Map<string, Song>;
  /** A file that did not read, and why; it is left as it is on disk. */
  unreadable: { file: string; error: string }[];
};

const CLIP_FILE = 'clip.json';
const SONG_FILE = 'song.json';

/** Reads every clip and song under `root`. */
export function openStore(root: string): Store {
  const store: Store = { root, clips: new Map(), songs: new Map(), unreadable: [] };
  for (const file of listFiles(join(root, 'clips'), CLIP_FILE)) {
    const clip = readChecked(store, file, checkClip);
    if (clip) store.clips.set(clip.id, clip);
  }
  for (const file of listFiles(join(root, 'songs'), SONG_FILE)) {
    const song = readChecked(store, file, checkSong);
    if (song) store.songs.set(song.id, song);
  }
  return store;
}

/** Reads every clip and song again, for files made outside the server (make/). */
export function rescanStore(store: Store): void {
  const fresh = openStore(store.root);
  store.clips = fresh.clips;
  store.songs = fresh.songs;
  store.unreadable = fresh.unreadable;
}

/** The folder a clip's files are in. */
export function getClipFolder(store: Store, clipId: string): string {
  return join(store.root, 'clips', clipId);
}

/** Writes a song to its file, then keeps it in memory. */
export function saveSong(store: Store, song: Song): void {
  writeJsonAtomically(join(store.root, 'songs', song.id, SONG_FILE), song);
  store.songs.set(song.id, song);
}

/** Writes a clip's metadata to its file, then keeps it in memory. Its audio and source are not touched. */
export function saveClip(store: Store, clip: Clip): void {
  writeJsonAtomically(join(getClipFolder(store, clip.id), CLIP_FILE), clip);
  store.clips.set(clip.id, clip);
}

/** The ids of the songs that have a block playing the clip. */
export function getSongsUsingClip(store: Store, clipId: string): string[] {
  return [...store.songs.values()]
    .filter((song) =>
      song.tracks.some((track) => track.blocks.some((block) => block.clip === clipId)),
    )
    .map((song) => song.id);
}

/** The clips made from the clip, as a variation or a split. */
export function getChildClips(store: Store, clipId: string): Clip[] {
  return [...store.clips.values()].filter((clip) => clip.parent?.clip === clipId);
}

/**
 * Writes JSON to a file through a file beside it that is then renamed over it, so a crash never
 * leaves half a file.
 */
export function writeJsonAtomically(file: string, value: unknown): void {
  mkdirSync(join(file, '..'), { recursive: true });
  const temporaryFile = `${file}.writing`;
  writeFileSync(temporaryFile, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporaryFile, file);
}

/** `<folder>/<id>/<name>` for every id folder that has that file. */
function listFiles(folder: string, name: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(folder, entry.name, name))
    .filter((file) => existsSync(file));
}

function readChecked<Checked>(
  store: Store,
  file: string,
  check: (value: unknown, path: string) => Checked,
): Checked | null {
  try {
    const value: unknown = JSON.parse(readFileSync(file, 'utf8'));
    return check(value, file);
  } catch (error) {
    store.unreadable.push({ file, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

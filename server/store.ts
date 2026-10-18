/**
 * The clips and songs in memory: read from `clips/<id>/clip.json` and `songs/<id>/song.json` when the
 * server starts, and every change written back to its file before the copy in memory changes. A
 * clip's facts are read from its source.fur beside its clip.json, and never written (docs/adr/0024).
 * The files are the data; this is only a copy of them (docs/adr/0006). Knows nothing of HTTP.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type { Clip, ClipRecord } from '../shared/clip.schema.ts';
import { clipRecordSchema } from '../shared/clip.schema.ts';
import { parseChecked } from '../shared/schema-parse.ts';
import type { Song } from '../shared/song.schema.ts';
import { songSchema } from '../shared/song.schema.ts';
import { readFurFile } from '../fur/read.ts';
import { getClipFacts } from '../make/fur-file-facts.ts';

/** The data folder's copy in memory, and the files that could not be read. */
export type Store = {
  root: string;
  clips: Map<string, Clip>;
  songs: Map<string, Song>;
  /** A file that did not read, and why; it is left as it is on disk. */
  unreadable: { file: string; error: string }[];
};

const CLIP_FILE = 'clip.json';
const SOURCE_FILE = 'source.fur';
const SONG_FILE = 'song.json';

/**
 * Reads every clip and song under `root`. A file that cannot be read is listed in `unreadable` and
 * left as it is.
 *
 * @param root - The data folder.
 * @returns The store, with what it read and the files it could not read.
 */
export function openStore(root: string): Store {
  const store: Store = { root, clips: new Map(), songs: new Map(), unreadable: [] };
  for (const file of listFiles(join(root, 'clips'), CLIP_FILE)) {
    const clip = readChecked(store, file, (value) => readClip(value, file));
    if (clip) store.clips.set(clip.id, clip);
  }
  for (const file of listFiles(join(root, 'songs'), SONG_FILE)) {
    const song = readChecked(store, file, (value) => parseChecked(songSchema, value, file));
    if (song) store.songs.set(song.id, song);
  }
  return store;
}

/**
 * Reads every clip and song again, to find files made outside the server (make/).
 *
 * @param store - The clips and songs in memory.
 */
export function rescanStore(store: Store): void {
  const fresh = openStore(store.root);
  store.clips = fresh.clips;
  store.songs = fresh.songs;
  store.unreadable = fresh.unreadable;
}

/**
 * Returns the folder a clip's files are in.
 *
 * @param store - The clips and songs in memory.
 * @param clipId - The clip's id.
 * @returns The path of the clip's folder.
 */
export function getClipFolder(store: Store, clipId: string): string {
  return join(store.root, 'clips', clipId);
}

/**
 * Writes a song to its file, then keeps it in memory.
 *
 * @param store - The clips and songs in memory.
 * @param song - The song to save.
 */
export function saveSong(store: Store, song: Song): void {
  writeJsonAtomically(join(store.root, 'songs', song.id, SONG_FILE), song);
  store.songs.set(song.id, song);
}

/**
 * Deletes a song's folder, then the clips it played that are left with no song to play them and no
 * clip made from them, and so on up to the clips those were made from. A clip that another song
 * plays, or that a kept clip was made from, stays.
 *
 * @param store - The clips and songs in memory.
 * @param songId - The id of the song to delete.
 * @returns The ids of the clips deleted with it.
 */
export function deleteSong(store: Store, songId: string): string[] {
  const song = store.songs.get(songId);
  if (!song) throw new Error(`no song ${songId}`);
  rmSync(join(store.root, 'songs', songId), { recursive: true, force: true });
  store.songs.delete(songId);
  const deleted: string[] = [];
  // a queue, not a set: a parent passed over while it still had a child is looked at again
  const queue = song.tracks.flatMap((track) => track.blocks.map((block) => block.clip));
  for (let clipId = queue.shift(); clipId !== undefined; clipId = queue.shift()) {
    const clip = store.clips.get(clipId);
    if (!clip || getSongsUsingClip(store, clipId).length > 0) continue;
    if (getChildClips(store, clipId).length > 0) continue;
    rmSync(getClipFolder(store, clipId), { recursive: true, force: true });
    store.clips.delete(clipId);
    deleted.push(clipId);
    if (clip.parent) queue.push(clip.parent.clip);
  }
  return deleted;
}

/**
 * Writes a clip's record to its clip.json, then keeps the clip in memory. Its facts are not written
 * (they are its source's), and its audio and source are not touched.
 *
 * @param store - The clips and songs in memory.
 * @param clip - The clip to save.
 */
export function saveClip(store: Store, clip: Clip): void {
  writeJsonAtomically(join(getClipFolder(store, clip.id), CLIP_FILE), getClipRecord(clip));
  store.clips.set(clip.id, clip);
}

/**
 * Returns a clip's record: what its clip.json holds, without the facts read from its source, as
 * its schema has it (which also holds it to its rules before it is written).
 *
 * @param clip - The clip.
 * @returns Its record.
 */
export function getClipRecord(clip: ClipRecord): ClipRecord {
  return parseChecked(clipRecordSchema, clip, clip.id);
}

/**
 * Returns the ids of the songs that have a block playing the clip.
 *
 * @param store - The clips and songs in memory.
 * @param clipId - The clip's id.
 * @returns The ids of those songs.
 */
export function getSongsUsingClip(store: Store, clipId: string): string[] {
  return [...store.songs.values()]
    .filter((song) =>
      song.tracks.some((track) => track.blocks.some((block) => block.clip === clipId)),
    )
    .map((song) => song.id);
}

/**
 * Returns the clips made from the clip, as a variation or a split.
 *
 * @param store - The clips and songs in memory.
 * @param clipId - The parent clip's id.
 * @returns The clips whose parent it is.
 */
export function getChildClips(store: Store, clipId: string): Clip[] {
  return [...store.clips.values()].filter((clip) => clip.parent?.clip === clipId);
}

/**
 * Writes JSON to a file through a file beside it that is then renamed over it, so a crash never
 * leaves half a file. The file's folder is made if it is missing.
 *
 * @param file - The path of the file.
 * @param value - The value to write.
 */
export function writeJsonAtomically(file: string, value: unknown): void {
  mkdirSync(join(file, '..'), { recursive: true });
  const temporaryFile = `${file}.writing`;
  writeFileSync(temporaryFile, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporaryFile, file);
}

/**
 * Lists `<folder>/<id>/<name>` for every id folder that has that file.
 *
 * @param folder - The folder of id folders.
 * @param name - The file's name in an id folder.
 * @returns The paths of the files found, or none when the folder is missing.
 */
function listFiles(folder: string, name: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(folder, entry.name, name))
    .filter((file) => existsSync(file));
}

/**
 * Reads a clip: its record from its clip.json, its facts from the source.fur beside it. Throws when
 * either does not read.
 *
 * @param value - The clip.json's content, parsed.
 * @param file - The clip.json's path.
 * @returns The clip.
 */
function readClip(value: unknown, file: string): Clip {
  const record = parseChecked(clipRecordSchema, value, file);
  const source = join(file, '..', SOURCE_FILE);
  return { ...record, ...getClipFacts(readFurFile(readFileSync(source))) };
}

function readChecked<Checked>(
  store: Store,
  file: string,
  check: (value: unknown) => Checked,
): Checked | null {
  try {
    const value: unknown = JSON.parse(readFileSync(file, 'utf8'));
    return check(value);
  } catch (error) {
    store.unreadable.push({ file, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * A clip.json or a song.json as read from disk, checked field by field into a Clip or a Song. A file
 * that does not fit is an error that names the file and the field (docs/code-guidelines.md: checked
 * where it comes in).
 */
import type { Status, Tag } from '../shared/catalogue.types.ts';
import type { BarRange, Clip, ClipName, ClipParent } from '../shared/clip.types.ts';
import type { Block, BlockTrim, Song, Track } from '../shared/song.types.ts';
import {
  getArray,
  getNumber,
  getObject,
  getOneOf,
  getString,
  getStringOrNull,
} from './json-checks.ts';

const STATUSES: readonly Status[] = ['new', 'heard', 'keeper', 'rejected'];
const TAG_SOURCES: readonly Tag['by'][] = ['claude', 'user'];
const RELATIONS: readonly ClipParent['relation'][] = ['variation', 'split'];

/** A status, as songs and clips hold it. */
export function checkStatus(value: unknown, path: string): Status {
  return getOneOf(value, path, STATUSES);
}

/** A list of tags. */
export function checkTags(value: unknown, path: string): Tag[] {
  return getArray(value, path, (item, itemPath) => {
    const tag = getObject(item, itemPath);
    return {
      name: getString(tag['name'], `${itemPath}.name`),
      by: getOneOf(tag['by'], `${itemPath}.by`, TAG_SOURCES),
    };
  });
}

/** A clip.json's content. */
export function checkClip(value: unknown, path: string): Clip {
  const clip = getObject(value, path);
  return {
    id: getString(clip['id'], `${path}.id`),
    created: getString(clip['created'], `${path}.created`),
    prompt: getString(clip['prompt'], `${path}.prompt`),
    promptId: getString(clip['promptId'], `${path}.promptId`),
    name: checkClipName(clip['name'], `${path}.name`),
    bars: clip['bars'] === null ? null : checkBarRange(clip['bars'], `${path}.bars`),
    channels:
      clip['channels'] === null ? null : getArray(clip['channels'], `${path}.channels`, getNumber),
    parent: clip['parent'] === null ? null : checkParent(clip['parent'], `${path}.parent`),
    madeFor: getStringOrNull(clip['madeFor'], `${path}.madeFor`),
    tags: checkTags(clip['tags'], `${path}.tags`),
    status: checkStatus(clip['status'], `${path}.status`),
    bpm: getNumber(clip['bpm'], `${path}.bpm`),
    beats: getNumber(clip['beats'], `${path}.beats`),
    key: getStringOrNull(clip['key'], `${path}.key`),
    chips: getArray(clip['chips'], `${path}.chips`, getString),
    seconds: getNumber(clip['seconds'], `${path}.seconds`),
    furnace: getStringOrNull(clip['furnace'], `${path}.furnace`),
  };
}

/** A song.json's content. */
export function checkSong(value: unknown, path: string): Song {
  const song = getObject(value, path);
  return {
    id: getString(song['id'], `${path}.id`),
    title: getString(song['title'], `${path}.title`),
    created: getString(song['created'], `${path}.created`),
    updated: getString(song['updated'], `${path}.updated`),
    bpm: getNumber(song['bpm'], `${path}.bpm`),
    beats: getNumber(song['beats'], `${path}.beats`),
    tags: checkTags(song['tags'], `${path}.tags`),
    status: checkStatus(song['status'], `${path}.status`),
    prompt: getString(song['prompt'], `${path}.prompt`),
    promptedFrom: getStringOrNull(song['promptedFrom'] ?? null, `${path}.promptedFrom`),
    tracks: getArray(song['tracks'], `${path}.tracks`, checkTrack),
  };
}

function checkClipName(value: unknown, path: string): ClipName {
  const name = getObject(value, path);
  return {
    section: getStringOrNull(name['section'], `${path}.section`),
    stem: getStringOrNull(name['stem'], `${path}.stem`),
  };
}

function checkBarRange(value: unknown, path: string): BarRange {
  const range = getObject(value, path);
  return {
    from: getNumber(range['from'], `${path}.from`),
    to: getNumber(range['to'], `${path}.to`),
  };
}

function checkParent(value: unknown, path: string): ClipParent {
  const parent = getObject(value, path);
  return {
    clip: getString(parent['clip'], `${path}.clip`),
    relation: getOneOf(parent['relation'], `${path}.relation`, RELATIONS),
  };
}

function checkTrack(value: unknown, path: string): Track {
  const track = getObject(value, path);
  return {
    id: getString(track['id'], `${path}.id`),
    name: getString(track['name'], `${path}.name`),
    blocks: getArray(track['blocks'], `${path}.blocks`, checkBlock),
  };
}

function checkBlock(value: unknown, path: string): Block {
  const block = getObject(value, path);
  return {
    clip: getString(block['clip'], `${path}.clip`),
    start: getNumber(block['start'], `${path}.start`),
    trim: block['trim'] === null ? null : checkTrim(block['trim'], `${path}.trim`),
    repeats: getNumber(block['repeats'], `${path}.repeats`),
  };
}

function checkTrim(value: unknown, path: string): BlockTrim {
  const trim = getObject(value, path);
  return {
    offset: getNumber(trim['offset'], `${path}.offset`),
    length: getNumber(trim['length'], `${path}.length`),
  };
}

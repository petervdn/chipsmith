/**
 * A clip.json or a song.json as read from disk, checked field by field into a Clip or a Song, and a
 * request's change to them. A file that does not fit is an error that names the file and the field (docs/code-guidelines.md: checked
 * where it comes in).
 */
import type { CatalogueChange, ClipChange } from '../shared/api.types.ts';
import type { Status, Tag } from '../shared/catalogue.types.ts';
import type { BarRange, ClipName, ClipParent, ClipRecord } from '../shared/clip.types.ts';
import type { Guide, GuideDraft, SentGuide } from '../shared/guide.types.ts';
import type { Block, BlockTrim, Song, Track } from '../shared/song.types.ts';
import {
  getArray,
  getBoolean,
  getNumber,
  getObject,
  getOneOf,
  getString,
  getStringOrNull,
} from './json-checks.ts';
import { checkSentHarmony } from './harmony-checks.ts';
import { checkSentStructure } from './structure-checks.ts';

const STATUSES: readonly Status[] = ['new', 'heard', 'keeper'];
const TAG_SOURCES: readonly Tag['by'][] = ['claude', 'user'];
const RELATIONS: readonly ClipParent['relation'][] = ['variation', 'split'];

/**
 * Checks a status, as songs and clips hold it.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The status.
 */
export function checkStatus(value: unknown, path: string): Status {
  return getOneOf(value, path, STATUSES);
}

/**
 * Checks a list of tags.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The tags.
 */
export function checkTags(value: unknown, path: string): Tag[] {
  return getArray(value, path, (item, itemPath) => {
    const tag = getObject(item, itemPath);
    return {
      name: getString(tag['name'], `${itemPath}.name`),
      by: getOneOf(tag['by'], `${itemPath}.by`, TAG_SOURCES),
    };
  });
}

/**
 * Checks the guides sent with a prompt. A file from before guides has none, read as an empty list.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The guides sent.
 */
export function checkSentGuides(value: unknown, path: string): SentGuide[] {
  return getArray(value ?? [], path, (item, itemPath) => {
    const guide = getObject(item, itemPath);
    return {
      id: getString(guide['id'], `${itemPath}.id`),
      name: getString(guide['name'], `${itemPath}.name`),
      text: getString(guide['text'], `${itemPath}.text`),
    };
  });
}

/**
 * Checks a guide.json's content.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The guide.
 */
export function checkGuide(value: unknown, path: string): Guide {
  const guide = getObject(value, path);
  return {
    id: getString(guide['id'], `${path}.id`),
    ...checkGuideDraft(guide, path),
    created: getString(guide['created'], `${path}.created`),
    updated: getString(guide['updated'], `${path}.updated`),
  };
}

/**
 * Checks a guide's name, text and default, as a request sends them. The name, trimmed, must not be
 * empty.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The guide's name, text and default.
 */
export function checkGuideDraft(value: unknown, path: string): GuideDraft {
  const draft = getObject(value, path);
  const name = getString(draft['name'], `${path}.name`).trim();
  if (!name) throw new Error(`${path}.name is empty`);
  return {
    name,
    text: getString(draft['text'], `${path}.text`),
    isDefault: getBoolean(draft['isDefault'], `${path}.isDefault`),
  };
}

/**
 * Checks a change to a song's or a clip's catalogue fields, sent in a request's body.
 *
 * @param body - The body parsed from JSON.
 * @returns The change, with only the fields the body sets.
 */
export function checkCatalogueChange(body: unknown): CatalogueChange {
  const change = getObject(body, 'body');
  const result: CatalogueChange = {};
  if (change['status'] !== undefined) result.status = checkStatus(change['status'], 'body.status');
  if (change['tags'] !== undefined) result.tags = checkTags(change['tags'], 'body.tags');
  return result;
}

/**
 * Checks a change to a clip's record sent in a request's body: its catalogue fields, and its label
 * if it is a variation.
 *
 * @param body - The body parsed from JSON.
 * @param clip - The clip changed, whose parent says whether it can have a label.
 * @param clip.parent - The clip it was made from, or null.
 * @returns The change, with only the fields the body sets.
 */
export function checkClipChange(body: unknown, { parent }: ClipRecord): ClipChange {
  const result: ClipChange = checkCatalogueChange(body);
  const variationLabel = getObject(body, 'body')['variationLabel'];
  if (variationLabel === undefined) return result;
  const label = checkVariationLabel(variationLabel, parent, 'body.variationLabel');
  if (label !== null) result.variationLabel = label;
  return result;
}

/**
 * Checks a clip.json's content. Fields it no longer holds (what its source says, docs/adr/0024) are
 * left out.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The clip's record.
 */
export function checkClipRecord(value: unknown, path: string): ClipRecord {
  const clip = getObject(value, path);
  const id = getString(clip['id'], `${path}.id`);
  const created = getString(clip['created'], `${path}.created`);
  const name = checkClipName(clip['name'], `${path}.name`);
  const bars = clip['bars'] === null ? null : checkBarRange(clip['bars'], `${path}.bars`);
  const parent = clip['parent'] === null ? null : checkParent(clip['parent'], `${path}.parent`);
  return {
    id,
    created,
    name,
    bars,
    parent,
    variationLabel: checkVariationLabel(clip['variationLabel'], parent, `${path}.variationLabel`),
    madeFor: getStringOrNull(clip['madeFor'], `${path}.madeFor`),
    tags: checkTags(clip['tags'], `${path}.tags`),
    status: checkStatus(clip['status'], `${path}.status`),
    key: getStringOrNull(clip['key'], `${path}.key`),
    furnace: getStringOrNull(clip['furnace'], `${path}.furnace`),
  };
}

/**
 * Checks a clip's variation label: a variation has one, written out, and any other clip none
 * (docs/adr/0036).
 *
 * @param value - The value parsed from JSON.
 * @param parent - The clip's parent, which says whether it is a variation.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The label, trimmed, or null for a clip that is not a variation.
 */
export function checkVariationLabel(
  value: unknown,
  parent: ClipParent | null,
  path: string,
): string | null {
  if (parent?.relation !== 'variation') {
    if (value !== null) throw new Error(`${path} is set, but the clip is not a variation`);
    return null;
  }
  const label = getString(value, path).trim();
  if (!label) throw new Error(`${path} is empty, and a variation needs one`);
  return label;
}

/**
 * Checks a song.json's content.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is (a file, or a field in one), named in an error.
 * @returns The song.
 */
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
    guides: checkSentGuides(song['guides'], `${path}.guides`),
    structure: checkSentStructure(song['structure'], `${path}.structure`),
    harmony: checkSentHarmony(song['harmony'], `${path}.harmony`),
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

/**
 * Checks a list of tracks, each with its blocks.
 *
 * @param value - The value to check, as it came in.
 * @param path - Where the value is, named in an error.
 * @returns The tracks.
 */
export function checkTracks(value: unknown, path: string): Track[] {
  return getArray(value, path, checkTrack);
}

function checkTrack(value: unknown, path: string): Track {
  const track = getObject(value, path);
  return {
    id: getString(track['id'], `${path}.id`),
    name: getString(track['name'], `${path}.name`),
    // songs saved before tracks had a level play at 0 dB, as rendered
    volume: track['volume'] === undefined ? 0 : getNumber(track['volume'], `${path}.volume`),
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

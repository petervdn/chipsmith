/**
 * A clip's notes for the note grid (docs/adr/0037), and a take made from them once edited, without
 * Claude: the clip's source.fur with one channel's notes, instruments and volumes set, its effects
 * kept, labelled "notes edited". It has no script, as none wrote it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getChannelName, isPitchedChannel } from '../shared/clip-channels.ts';
import type { ChannelRow, ClipNotes } from '../shared/clip-notes.types.ts';
import type { Clip } from '../shared/clip.types.ts';
import { getChannelRows, getRowCount, setChannelRows } from '../fur/channel-rows.ts';
import type { FurFile } from '../fur/fur.types.ts';
import { readFurFile } from '../fur/read.ts';
import { makeTake } from './make-take.ts';

/** Rows to a beat when a song does not say. */
const DEFAULT_ROWS_PER_BEAT = 4;

/**
 * Returns a clip's notes: each pitched channel that plays, as its run of rows.
 *
 * @param root - The data folder.
 * @param clip - The clip.
 * @returns Its rows to a beat and a bar, and its channels' notes.
 */
export function readClipNotes(root: string, clip: Clip): ClipNotes {
  const furFile = readClipFur(root, clip.id);
  const rowsPerBeat = furFile.song.highlights.first || DEFAULT_ROWS_PER_BEAT;
  return {
    rowsPerBeat,
    rowsPerBar: furFile.song.highlights.second || rowsPerBeat * clip.beats,
    channels: clip.channels
      .filter((channel) => isPitchedChannel(clip.chips, channel))
      .map((channel) => ({
        channel,
        name: getChannelName(clip.chips, channel),
        rowCount: getRowCount(furFile, channel),
        rows: getChannelRows(furFile, channel),
      })),
  };
}

/**
 * Makes a take of a clip with one channel's rows edited, rendered and kept as a variation of it.
 *
 * @param take - What it is made of.
 * @param take.root - The data folder.
 * @param take.parent - The clip edited.
 * @param take.songId - The song it was edited in.
 * @param take.channel - The channel edited; one of the clip's pitched channels.
 * @param take.rows - The channel's rows as edited.
 * @returns The id of the clip made.
 */
export async function makeNotesTake({
  root,
  parent,
  songId,
  channel,
  rows,
}: {
  root: string;
  parent: Clip;
  songId: string;
  channel: number;
  rows: ChannelRow[];
}): Promise<string> {
  if (!parent.channels.includes(channel) || !isPitchedChannel(parent.chips, channel)) {
    throw new Error(`channel ${channel} is not one of ${parent.id}'s pitched channels`);
  }
  return makeTake({
    root,
    parent,
    channels: null,
    songId,
    furFile: setChannelRows(readClipFur(root, parent.id), channel, rows),
    label: 'notes edited',
    scriptFile: null,
    tags: [],
    key: parent.key,
  });
}

function readClipFur(root: string, clipId: string): FurFile {
  return readFurFile(readFileSync(join(root, 'clips', clipId, 'source.fur')));
}

/**
 * A clip's notes for the note grid (docs/adr/0037), and a take made from them once edited, without
 * Claude: the clip's source.fur with one channel's notes, instruments and volumes set, its effects
 * kept, labelled "notes edited", or as the take it updates (docs/adr/0039). It has no script, as
 * none wrote it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getChannelName, isPitchedChannel } from '../shared/clip-channels.ts';
import type { ChannelRow, ClipNotes } from '../shared/clip-notes.schema.ts';
import type { Clip } from '../shared/clip.schema.ts';
import { getChannelRows, getRowCount, setChannelRows } from '../fur/channel-rows.ts';
import type { FurFile } from '../fur/fur.types.ts';
import { readFurFile } from '../fur/read.ts';
import { makeTake } from './make-take.ts';

/** What a take of edited notes is called when it is made. */
export const NOTES_TAKE_LABEL = 'notes edited';

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
 * Makes a take of a clip with one channel's rows edited, rendered and kept as a variation: of the
 * clip edited, or of the clip a take was made from when it updates that take.
 *
 * @param take - What it is made of.
 * @param take.root - The data folder.
 * @param take.edited - The clip whose notes were edited.
 * @param take.parent - The clip the take is a variation of: the clip edited, or the parent of the
 *   take it updates.
 * @param take.label - The take's label: NOTES_TAKE_LABEL, or the label of the take it updates.
 * @param take.songId - The song it was edited in.
 * @param take.channel - The channel edited; one of the clip's pitched channels.
 * @param take.rows - The channel's rows as edited.
 * @returns The id of the clip made.
 */
export async function makeNotesTake({
  root,
  edited,
  parent,
  label,
  songId,
  channel,
  rows,
}: {
  root: string;
  edited: Clip;
  parent: Clip;
  label: string;
  songId: string;
  channel: number;
  rows: ChannelRow[];
}): Promise<string> {
  if (!edited.channels.includes(channel) || !isPitchedChannel(edited.chips, channel)) {
    throw new Error(`channel ${channel} is not one of ${edited.id}'s pitched channels`);
  }
  return makeTake({
    root,
    parent,
    channels: null,
    songId,
    furFile: setChannelRows(readClipFur(root, edited.id), channel, rows),
    label,
    scriptFile: null,
    tags: [],
    key: edited.key,
  });
}

function readClipFur(root: string, clipId: string): FurFile {
  return readFurFile(readFileSync(join(root, 'clips', clipId, 'source.fur')));
}

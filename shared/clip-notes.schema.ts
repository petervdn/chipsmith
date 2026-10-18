/**
 * A clip's notes as the note grid edits them (docs/adr/0037): each pitched channel that plays, as one
 * run of rows from its first order to its last, the rows that hold a note, an instrument or a volume.
 * A row is validated where the grid sends it back; the rest is what the server answers.
 */
import { z } from 'zod';
import { MACRO_RELEASE } from '../fur/notes.ts';

/** The most an instrument or a volume can be: a byte. */
const MOST_BYTE = 255;

/** A row of a channel that holds a note, an instrument or a volume, by its place in the run. */
export const channelRowSchema = z.object({
  row: z.number().int().min(0),
  /** The note, C-0 being 60; 180 a note off, 181 and 182 releases (fur/notes.ts); null for none. */
  note: z.number().int().min(0).max(MACRO_RELEASE).nullable(),
  instrument: z.number().int().min(0).max(MOST_BYTE).nullable(),
  volume: z.number().int().min(0).max(MOST_BYTE).nullable(),
});

/** A row of a channel that holds a note, an instrument or a volume. */
export type ChannelRow = z.infer<typeof channelRowSchema>;

/** A channel's notes: its number and name, how many rows its run has, and its rows. */
export type ChannelNotes = { channel: number; name: string; rowCount: number; rows: ChannelRow[] };

/** A clip's notes: rows to a beat and to a bar, and each pitched channel that plays. */
export type ClipNotes = { rowsPerBeat: number; rowsPerBar: number; channels: ChannelNotes[] };

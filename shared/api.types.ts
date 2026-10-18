/**
 * What the server's routes answer with (server/api.ts), so the page reads them typed. Plain types:
 * the page trusts them, nothing parses them (docs/adr/0038). What a request sends is in
 * api-requests.schema.ts.
 */
import type { Clip } from './clip.schema.ts';
import type { ChipFamily, Reference } from './reference.schema.ts';
import type { Song } from './song.schema.ts';

/** A song in the songs list, with what the list shows of it. */
export type SongListing = {
  song: Song;
  seconds: number;
  clipCount: number;
  /** Whether a clip of the song has no audio yet: it is rendered when the server starts. */
  isWaitingForAudio: boolean;
  /** Whether a clip of the song is, or was cut from, a variation: changed after the song's prompt (docs/adr/0036). */
  isChangedAfterPrompt: boolean;
  /** The key its clips name, the first one found. */
  key: string | null;
  chips: string[];
  /** The songs made by sending this one's prompt again. */
  promptedAgainAs: string[];
};

/**
 * A song opened, with the clips its blocks play, whether one of them has no audio yet, and which
 * (being rendered, as after a split).
 */
export type SongDetail = {
  song: Song;
  clips: Clip[];
  isWaitingForAudio: boolean;
  waitingClipIds: string[];
};

/** A clip in the clips list, with the songs that use it. */
export type ClipListing = { clip: Clip; usedBy: string[] };

/** What deleting a song answers: the clips deleted with it, which no other song played. */
export type SongDeletion = { clipIds: string[] };

/** A take made of a clip without Claude (a transpose): the new clip's id. */
export type TakeMade = { clipId: string };

/** A take deleted (docs/adr/0039): the clip that now plays where it did. */
export type TakeDeleted = { replacedBy: string };

/** A program the app calls (config/settings.ts). */
export type ProgramName = 'furnace' | 'furnaceApp' | 'ffmpeg' | 'claude' | 'node';

/** Whether a program can be run, its version, and what it is needed for. */
export type ProgramCheck = {
  name: ProgramName;
  path: string;
  /** The setting that points to it, such as `CHIPSMITH_FURNACE`. */
  variable: string;
  neededFor: string;
  /** Its version, when it ran and named one. */
  version: string | null;
  /** Why it cannot be used, or null. */
  error: string | null;
};

/** What `POST /api/clips/<id>/open` answers: the copy of the clip's .fur file Furnace opened. */
export type ClipOpened = { file: string };

/** A reference as `/api/references` lists it: its record and the facts read from its files. */
export type ReferenceListing = {
  reference: Reference;
  name: string;
  author: string;
  album: string;
  /** Its chips' short labels (`NES`, `VRC6`), in order. */
  chips: string[];
  family: ChipFamily | null;
  /** Its channels' names, in order: channel 1 first. */
  channels: string[];
  subsongCount: number;
  /** The length of its audio, or null while it has none. */
  seconds: number | null;
};

/** A change to a reference: what the user writes of it. */
export type ReferenceChange = { notes: string };

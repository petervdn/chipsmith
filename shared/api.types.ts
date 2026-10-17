/** What the server's routes answer with and take (server/api.ts), so the page reads them typed. */
import type { Status, Tag } from './catalogue.types.ts';
import type { Clip } from './clip.types.ts';
import type { Song } from './song.types.ts';

/** A song in the songs list, with what the list shows of it. */
export type SongListing = {
  song: Song;
  seconds: number;
  clipCount: number;
  /** Whether a clip of the song has no audio yet: it is rendered when the server starts. */
  isWaitingForAudio: boolean;
  /** Whether a clip of the song was made by a later prompt than the song's own (docs/adr/0016). */
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

/** A change to a song's or a clip's catalogue fields; a field left out stays as it is. */
export type CatalogueChange = { status?: Status; tags?: Tag[] };

/** A program the app calls (config/settings.ts). */
export type ProgramName = 'furnace' | 'ffmpeg' | 'claude' | 'node';

/** Whether a program can be run, its version, and what it is needed for. */
export type ProgramCheck = {
  name: ProgramName;
  path: string;
  neededFor: string;
  /** Its version, when it ran and named one. */
  version: string | null;
  /** Why it cannot be used, or null. */
  error: string | null;
};

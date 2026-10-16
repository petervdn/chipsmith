/** What the server's routes answer with and take (server/api.ts), so the page reads them typed. */
import type { Status, Tag } from './catalogue.types.ts';
import type { Clip } from './clip.types.ts';
import type { Song } from './song.types.ts';

/** A song in the songs list, with what the list shows of it. */
export type SongListing = {
  song: Song;
  seconds: number;
  clipCount: number;
  /** Whether a clip of the song was made by a later prompt than the song's own (docs/adr/0016). */
  isChangedAfterPrompt: boolean;
  /** The key its clips name, the first one found. */
  key: string | null;
  chips: string[];
  /** The songs made by sending this one's prompt again. */
  promptedAgainAs: string[];
};

/** A song opened, with the clips its blocks play. */
export type SongDetail = { song: Song; clips: Clip[] };

/** A clip in the clips list, with the songs that use it. */
export type ClipListing = { clip: Clip; usedBy: string[] };

/** A change to a song's or a clip's catalogue fields; a field left out stays as it is. */
export type CatalogueChange = { status?: Status; tags?: Tag[] };

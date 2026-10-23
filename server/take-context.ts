/**
 * What a job of takes is told of its clip, worked out by the server so Claude need not read it: the
 * clip's facts and label, its song and tracks, the channels a take keeps (by number and name), the
 * size of its channels' runs of rows, and the script that wrote it (or the clip as tracker text when
 * it has none). Knows nothing of prompts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getChannelRun } from '../fur/channel-rows.ts';
import { readFurFile } from '../fur/read.ts';
import { getTrackerText } from '../fur/tracker-text.ts';
import { getChannelName } from '../shared/clip-channels.ts';
import { getTakeChannels } from '../shared/clip-lineage.ts';
import type { TakesTarget } from '../shared/job.schema.ts';
import type { Store } from './store.ts';
import { getClipFolder } from './store.ts';

/** A channel a take keeps: its number in the .fur file and its name. */
export type KeptChannel = { channel: number; name: string };

/** What a job of takes is told of its clip. */
export type TakeContext = {
  clipId: string;
  /** What the clip is called: its label, or its stem or section, or "the whole song". */
  label: string;
  songId: string;
  songTitle: string;
  bpm: number;
  beats: number;
  seconds: number;
  chips: string[];
  /** The rows of each channel's run, and how many make a bar. */
  rowCount: number;
  rowsPerBar: number;
  /** The channels a take keeps, or null when it keeps every channel. */
  keptChannels: KeptChannel[] | null;
  /** The song's tracks, each as its name and the clips its blocks play. */
  tracks: string[];
  /** The script that wrote the clip, or null when it has none. */
  script: string | null;
  /** The clip as tracker text, when it has no script; null when it has one. */
  trackerText: string | null;
};

/**
 * Returns what a job of takes is told of its clip. Throws when the clip or the song is gone.
 *
 * @param store - The clips and songs.
 * @param takesOf - The clip the takes are of, and the song they were asked in.
 * @returns The clip's context.
 */
export function getTakeContext(store: Store, takesOf: TakesTarget): TakeContext {
  const clip = store.clips.get(takesOf.clip);
  if (!clip) throw new Error(`the clip ${takesOf.clip} is gone`);
  const song = store.songs.get(takesOf.song);
  if (!song) throw new Error(`the song ${takesOf.song} is gone`);
  const folder = getClipFolder(store, clip.id);
  const furFile = readFurFile(readFileSync(join(folder, 'source.fur')));
  const names = furFile.song.channelNames.map((own, channel) =>
    [own, getChannelName(clip.chips, channel)].filter(Boolean).join(' · '),
  );
  const channels = getTakeChannels(clip, (clipId) => store.clips.get(clipId));
  const scriptFile = join(folder, 'script.ts');
  const script = existsSync(scriptFile) ? readFileSync(scriptFile, 'utf8') : null;
  return {
    clipId: clip.id,
    label: clip.variationLabel ?? clip.name.stem ?? clip.name.section ?? 'the whole song',
    songId: song.id,
    songTitle: song.title,
    bpm: clip.bpm,
    beats: clip.beats,
    seconds: clip.seconds,
    chips: clip.chips,
    rowCount: getChannelRun(furFile, channels?.[0] ?? 0).length,
    rowsPerBar: furFile.song.highlights.second,
    keptChannels: channels?.map((channel) => ({ channel, name: names[channel] ?? '' })) ?? null,
    tracks: song.tracks.map(
      (track) => `${track.name}: ${track.blocks.map((block) => block.clip).join(', ') || 'empty'}`,
    ),
    script,
    trackerText: script === null ? getTrackerText(furFile, names) : null,
  };
}

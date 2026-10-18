/**
 * What a song's page shows of it above the editor, as labelled facts: the song itself (tempo, meter,
 * length, chips, key, tracks, clips, when it was made and changed, its id) and what its prompt was
 * sent with (the style guides, the structure, the harmony, its tags). Given the song and its clips,
 * gives words; knows nothing of the page.
 */
import type { Clip } from '../../../shared/clip.schema.ts';
import { getHarmonySummary } from '../../../shared/harmony-prompt.ts';
import type { Song } from '../../../shared/song.schema.ts';
import { getSongSeconds } from '../../../shared/song-length.ts';
import type { SentStructure } from '../../../shared/structure.schema.ts';
import { formatDate, formatMeter, formatSeconds } from '../../format.ts';

/** A fact shown with its label. */
export type SongFact = { label: string; value: string };

/** What the page shows of a song above the editor: its prompt, its facts, what the prompt was sent with. */
export type SongSummary = { prompt: string; facts: SongFact[]; promptFacts: SongFact[] };

/**
 * Returns what the page shows of a song above the editor.
 *
 * @param song - The song.
 * @param clips - The clips its blocks play.
 * @returns Its prompt, its facts, and what its prompt was sent with.
 */
export function getSongSummary(song: Song, clips: Clip[]): SongSummary {
  return {
    prompt: song.prompt,
    facts: getSongFacts(song, clips),
    promptFacts: getPromptFacts(song),
  };
}

/**
 * Returns the song's own facts, each with its label, in the order they are shown.
 *
 * @param song - The song.
 * @param clips - The clips its blocks play.
 * @returns The facts; one the song has none of (a key, a change) is left out.
 */
export function getSongFacts(song: Song, clips: Clip[]): SongFact[] {
  const seconds = getSongSeconds(
    song,
    (clipId) => clips.find((clip) => clip.id === clipId)?.seconds ?? 0,
  );
  const chips = [...new Set(clips.flatMap((clip) => clip.chips))];
  const key = clips.find((clip) => clip.key)?.key ?? null;
  const facts: (SongFact | null)[] = [
    { label: 'tempo', value: `${Math.round(song.bpm)} bpm` },
    { label: 'meter', value: formatMeter(song.beats) },
    { label: 'length', value: formatSeconds(seconds) },
    chips.length > 0 ? { label: 'chips', value: chips.join(' + ') } : null,
    key ? { label: 'key', value: key } : null,
    { label: 'tracks', value: String(song.tracks.length) },
    { label: 'clips', value: String(new Set(clips.map((clip) => clip.id)).size) },
    { label: 'made', value: formatDate(song.created) },
    song.updated !== song.created ? { label: 'changed', value: formatDate(song.updated) } : null,
    { label: 'id', value: song.id },
  ];
  return facts.filter((fact) => fact !== null);
}

/**
 * Returns what the song's prompt was sent with, each with its label: the style guides, the
 * structure, the harmony, and the song's tags.
 *
 * @param song - The song.
 * @returns The facts; what it was not sent with is left out.
 */
export function getPromptFacts(song: Song): SongFact[] {
  const harmony = song.harmony ? getHarmonySummary(song.harmony) : '';
  const facts: (SongFact | null)[] = [
    song.guides.length > 0
      ? { label: 'style guides', value: song.guides.map((guide) => guide.name).join(', ') }
      : null,
    song.structure?.sections.length
      ? { label: 'structure', value: getStructureText(song.structure) }
      : null,
    harmony ? { label: 'harmony', value: harmony } : null,
    song.tags.length > 0
      ? { label: 'tags', value: song.tags.map((tag) => tag.name).join(', ') }
      : null,
  ];
  return facts.filter((fact) => fact !== null);
}

/**
 * Returns a structure in a few words: its name, its sections by letter, and its bars (unless its
 * name tells them).
 *
 * @param structure - The structure sent.
 * @param structure.name - Its name.
 * @param structure.sections - Its sections.
 * @returns The words, like "AABA · A A′ B A · 32 bars".
 */
export function getStructureText({ name, sections }: SentStructure): string {
  const letters = sections.map(({ letter, variant }) => `${letter}${'′'.repeat(variant)}`);
  const bars = sections.reduce((total, section) => total + section.bars, 0);
  const barsText = /\bbars?\b/.test(name) ? null : `${bars} bars`;
  return [name, letters.join(' '), barsText].filter(Boolean).join(' · ');
}

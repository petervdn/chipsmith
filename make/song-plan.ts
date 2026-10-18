/**
 * What a job's script gives: a plan per song or take (title, furFile, tags, key). A script's default
 * export is a function that returns them (the furnace-song skill). Parsed by its schema here, as the
 * script is code from a prompt (docs/adr/0038); the schema is make's alone, so it sits here.
 */
import { z } from 'zod';
import type { FurFile } from '../fur/fur.types.ts';
import { parseChecked } from '../shared/schema-parse.ts';

/** One song (or take) a script makes: its title, its .fur file, its tags and its key. */
export const songPlanSchema = z.object({
  title: z.string().min(1, 'has no title'),
  furFile: z.custom<FurFile>(isFurFile, 'is not a .fur file from buildFurFile'),
  tags: z.array(z.string()).default([]),
  key: z.string().nullable().default(null),
});

/** One song (or take) a script makes. */
export type SongPlan = z.infer<typeof songPlanSchema>;

/** What a script makes: one plan or more. */
const songPlansSchema = z.array(songPlanSchema).min(1, 'the script made no songs');

/** What a job's script exports as its default. */
export type SongScript = () => SongPlan[];

/**
 * Returns the plans a script's default export gives, each parsed.
 *
 * @param scriptExports - The script's module, as imported.
 * @returns The plan of every song the script makes; an error is thrown when there is no default
 * export function, it makes no songs, or a plan does not fit.
 */
export function getSongPlans(scriptExports: unknown): SongPlan[] {
  const makeSongs =
    typeof scriptExports === 'object' && scriptExports !== null && 'default' in scriptExports
      ? scriptExports.default
      : null;
  if (typeof makeSongs !== 'function') throw new Error('the script has no default export function');
  const plans: unknown = makeSongs();
  return parseChecked(songPlansSchema, plans, 'the songs');
}

/**
 * Tells whether a value is a .fur file as `buildFurFile` makes it: its song, instruments,
 * wavetables and patterns.
 *
 * @param value - The value a plan gives as its furFile.
 * @returns Whether it is one.
 */
function isFurFile(value: unknown): value is FurFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'song' in value &&
    'instruments' in value &&
    'wavetables' in value &&
    'patterns' in value
  );
}

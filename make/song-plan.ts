/**
 * What a job's script gives: a plan per song (title, module, tags, key). A script's default export is
 * a function that returns them (notes/making-songs.md). Checked here, as the script is code from a
 * prompt.
 */
import type { FurModule } from '../fur/fur.types.ts';

/** One song a script makes. */
export type SongPlan = { title: string; module: FurModule; tags: string[]; key: string | null };

/** What a job's script exports as its default. */
export type SongScript = () => SongPlan[];

/** The plans a script's default export gives, checked. */
export function getSongPlans(scriptExports: unknown): SongPlan[] {
  const makeSongs =
    typeof scriptExports === 'object' && scriptExports !== null && 'default' in scriptExports
      ? scriptExports.default
      : null;
  if (typeof makeSongs !== 'function') throw new Error('the script has no default export function');
  const plans: unknown = makeSongs();
  if (!Array.isArray(plans) || plans.length === 0) throw new Error('the script made no songs');
  return plans.map((plan: unknown, i) => checkPlan(plan, `song ${i + 1}`));
}

function checkPlan(plan: unknown, path: string): SongPlan {
  if (typeof plan !== 'object' || plan === null) throw new Error(`${path}: not an object`);
  const title = 'title' in plan ? plan.title : null;
  const module = 'module' in plan ? plan.module : null;
  const tags = 'tags' in plan ? plan.tags : [];
  const key = 'key' in plan ? plan.key : null;
  if (typeof title !== 'string' || !title) throw new Error(`${path}: no title`);
  if (!isModule(module)) throw new Error(`${path} (${title}): no module`);
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
    throw new Error(`${path} (${title}): tags are not a list of words`);
  }
  if (key !== null && typeof key !== 'string') {
    throw new Error(`${path} (${title}): key not a string`);
  }
  return { title, module, tags, key };
}

function isModule(value: unknown): value is FurModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    'song' in value &&
    'instruments' in value &&
    'wavetables' in value &&
    'patterns' in value
  );
}

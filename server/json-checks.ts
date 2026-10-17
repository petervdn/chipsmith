/**
 * Checks that a value parsed from JSON is what a type says, for reading files and request bodies
 * without `as` (docs/code-guidelines.md). Each check throws with the path of the field that is wrong.
 */

/** A JSON object, its fields not yet checked. */
export type JsonObject = { [key: string]: unknown };

/** Whether a value is a JSON object (not null, not an array). */
export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The value as an object, or an error naming where it was. */
export function getObject(value: unknown, path: string): JsonObject {
  if (!isObject(value)) throw new Error(`${path}: not an object`);
  return value;
}

/** The value as a string. */
export function getString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`${path}: not a string`);
  return value;
}

/** The value as a string, or null. */
export function getStringOrNull(value: unknown, path: string): string | null {
  return value === null ? null : getString(value, path);
}

/** The value as a finite number. */
export function getNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${path}: not a number`);
  }
  return value;
}

/** The value as a boolean. */
export function getBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${path}: not true or false`);
  return value;
}

/** The value as an array, each item checked by `getItem`. */
export function getArray<Item>(
  value: unknown,
  path: string,
  getItem: (item: unknown, itemPath: string) => Item,
): Item[] {
  if (!Array.isArray(value)) throw new Error(`${path}: not an array`);
  return value.map((item: unknown, i) => getItem(item, `${path}[${i}]`));
}

/** The value as one of a fixed list of strings. */
export function getOneOf<Option extends string>(
  value: unknown,
  path: string,
  allowed: readonly Option[],
): Option {
  const found = allowed.find((option) => option === value);
  if (found === undefined) throw new Error(`${path}: not one of ${allowed.join(', ')}`);
  return found;
}

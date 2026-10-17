/**
 * Checks that a value parsed from JSON is what a type says, for reading files and request bodies
 * without `as` (docs/code-guidelines.md). Each check throws with the path of the field that is wrong.
 */

/** A JSON object, its fields not yet checked. */
export type JsonObject = { [key: string]: unknown };

/**
 * Checks whether a value is a JSON object: not null, and not an array.
 *
 * @param value - The value parsed from JSON.
 * @returns Whether it is an object.
 */
export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns the value as an object, or throws an error naming where it was.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in the error.
 * @returns The value, as an object.
 */
export function getObject(value: unknown, path: string): JsonObject {
  if (!isObject(value)) throw new Error(`${path}: not an object`);
  return value;
}

/**
 * Returns the value as a string, or throws if it is not one.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in the error.
 * @returns The value, as a string.
 */
export function getString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`${path}: not a string`);
  return value;
}

/**
 * Returns the value as a string or null, or throws if it is neither.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in the error.
 * @returns The value, as a string, or null.
 */
export function getStringOrNull(value: unknown, path: string): string | null {
  return value === null ? null : getString(value, path);
}

/**
 * Returns the value as a finite number, or throws if it is not one.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in the error.
 * @returns The value, as a number.
 */
export function getNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${path}: not a number`);
  }
  return value;
}

/**
 * Returns the value as a boolean, or throws if it is not one.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in the error.
 * @returns The value, as a boolean.
 */
export function getBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${path}: not true or false`);
  return value;
}

/**
 * Returns the value as an array, each item checked by `getItem`, or throws if it is not an array.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in the error.
 * @param getItem - Checks an item and returns it as its type; it is given the item's path.
 * @returns The checked items.
 */
export function getArray<Item>(
  value: unknown,
  path: string,
  getItem: (item: unknown, itemPath: string) => Item,
): Item[] {
  if (!Array.isArray(value)) throw new Error(`${path}: not an array`);
  return value.map((item: unknown, i) => getItem(item, `${path}[${i}]`));
}

/**
 * Returns the value as one of a fixed list of strings, or throws if it is none of them.
 *
 * @param value - The value parsed from JSON.
 * @param path - Where the value is, named in the error.
 * @param allowed - The strings it may be.
 * @returns The value, as one of the allowed strings.
 */
export function getOneOf<Option extends string>(
  value: unknown,
  path: string,
  allowed: readonly Option[],
): Option {
  const found = allowed.find((option) => option === value);
  if (found === undefined) throw new Error(`${path}: not one of ${allowed.join(', ')}`);
  return found;
}

/**
 * Parsing what comes in from a file or a request with its Zod schema (docs/adr/0038), and reporting
 * what does not fit: where it came from and the field that is wrong. Knows nothing of files.
 */
import type { z } from 'zod';

/** How many problems an error names; a file wrong all over says the first few. */
const MOST_PROBLEMS = 3;

/**
 * Returns a value parsed by a schema, or throws an error naming where it came from and the fields
 * that do not fit (the first few).
 *
 * @param schema - The schema it should fit.
 * @param value - The value, not yet checked (parsed from JSON).
 * @param where - Where it came from (a file, `body`), named in the error.
 * @returns The value as the schema gives it: checked, trimmed and with its defaults.
 */
export function parseChecked<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
  where: string,
): z.output<Schema> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const problems = result.error.issues.map(({ path, message }) => {
    const field = getPathText(path);
    if (!field) return `${where}: ${message}`;
    return field.startsWith('[') ? `${where}${field}: ${message}` : `${where}.${field}: ${message}`;
  });
  const more = problems.length - MOST_PROBLEMS;
  const shown = problems.slice(0, MOST_PROBLEMS).join('; ');
  throw new Error(more > 0 ? `${shown}; and ${more} more` : shown);
}

/**
 * Returns a field's path as it is written in code: `tracks[0].volume`.
 *
 * @param path - The keys and indexes down to the field.
 * @returns The path, or an empty string for the value itself.
 */
export function getPathText(path: readonly PropertyKey[]): string {
  return path
    .map((key, i) => (typeof key === 'number' ? `[${key}]` : `${i > 0 ? '.' : ''}${String(key)}`))
    .join('');
}

// The source's map stays true: every folder of the source has a README.md that names each of its
// files and folders in a line of its own (`- \`name.ts\`: what it is`), and nothing that is not
// there; every source file starts with a comment that says what it is; and no file is longer than
// LIMIT lines (docs/code-guidelines.md, "Files").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The folders that hold source. */
const ROOTS = ['src', 'server', 'shared', 'fur', 'render', 'make', 'config'];
/** The lines past which a file is split by its subjects. */
const LIMIT = 400;
const SOURCE = /\.(ts|tsx|css)$/;

function getFolders(dir: string): string[] {
  const subs = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());
  return [dir, ...subs.flatMap((name) => getFolders(join(dir, name)))];
}

/**
 * Returns what a folder's README should name: its source files (not tests) and its folders.
 *
 * @param dir - The folder.
 * @returns The source files' names, and each folder's name with a "/" after it.
 */
function getContents(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (statSync(join(dir, name)).isDirectory()) return [`${name}/`];
    return SOURCE.test(name) && !name.includes('.test.') ? [name] : [];
  });
}

/**
 * Returns what a README names: the first `name` of each line that starts with "- ".
 *
 * @param readme - The README's text.
 * @returns The names, in order.
 */
function getNamed(readme: string): string[] {
  return readme.split('\n').flatMap((line) => /^- `([^`]+)`/.exec(line)?.[1] ?? []);
}

const folders = ROOTS.flatMap(getFolders);
const files = folders.flatMap((dir) =>
  readdirSync(dir)
    .filter((name) => SOURCE.test(name))
    .map((name) => join(dir, name)),
);

test('every folder of the source has a README that names all it holds, and nothing more', () => {
  const wrong: string[] = [];
  for (const dir of folders) {
    const readme = join(dir, 'README.md');
    if (!existsSync(readme)) {
      wrong.push(`${dir}: no README.md`);
      continue;
    }
    const has = getContents(dir);
    const says = getNamed(readFileSync(readme, 'utf8'));
    for (const name of has) if (!says.includes(name)) wrong.push(`${readme} does not name ${name}`);
    for (const name of says) {
      if (!has.includes(name)) wrong.push(`${readme} names ${name}, not there`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('every source file starts with a comment that says what it is', () => {
  const bare = files.filter((file) => !/^\s*(\/\/|\/\*)/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(bare, []);
});

test(`no source file is longer than ${LIMIT} lines`, () => {
  const long = files.filter((file) => readFileSync(file, 'utf8').split('\n').length > LIMIT);
  assert.deepEqual(long, []);
});

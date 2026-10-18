/**
 * The rows the home page shows of the programs the app runs: one per program, by the name it is
 * known by, but one row for Furnace when the same Furnace both renders and opens files. Knows
 * nothing of the page.
 */
import type { ProgramCheck, ProgramName } from '../../shared/api.types.ts';

/** A program as the home page shows it: what it is called, and its check. */
export type ProgramRow = ProgramCheck & { label: string };

/** Each program the app runs, by the name it is known by when it has a row of its own. */
const PROGRAM_LABELS = {
  node: 'Node',
  furnace: 'Furnace renderer',
  furnaceApp: 'Furnace app',
  ffmpeg: 'ffmpeg',
  claude: 'Claude Code',
} satisfies Record<ProgramName, string>;

/**
 * Returns the rows to show of the programs' checks, in their order: the Furnace that renders and
 * the one that opens files are one row, "Furnace", when they are the same program.
 *
 * @param checks - The programs' checks, as the server gives them.
 * @returns A row per program, Furnace's two as one when they have one path.
 */
export function getProgramRows(checks: ProgramCheck[]): ProgramRow[] {
  const app = checks.find((check) => check.name === 'furnaceApp');
  const isOneFurnace = !hasTwoFurnaces(checks);
  return checks.flatMap((check): ProgramRow[] => {
    if (isOneFurnace && check.name === 'furnaceApp') return [];
    if (isOneFurnace && check.name === 'furnace' && app) {
      return [
        {
          ...check,
          label: 'Furnace',
          neededFor: `${check.neededFor}, ${app.neededFor}`,
          error: check.error ?? app.error,
        },
      ];
    }
    return [{ ...check, label: PROGRAM_LABELS[check.name] }];
  });
}

/**
 * Tells whether the Furnace that renders and the one that opens files are two programs (a build of
 * its own set to render, beside the app).
 *
 * @param checks - The programs' checks, as the server gives them.
 * @returns Whether both are checked and their paths differ.
 */
export function hasTwoFurnaces(checks: ProgramCheck[]): boolean {
  const renderer = checks.find((check) => check.name === 'furnace');
  const app = checks.find((check) => check.name === 'furnaceApp');
  return renderer !== undefined && app !== undefined && renderer.path !== app.path;
}

// The logo: a note above an anvil, drawn on a grid of pixels in the look's colours; the note has an
// outline of a pixel, seen where the page is light.

/** A run of pixels on one row: x, y and how many. */
type PixelRun = [number, number, number];

/** The grid: 16 pixels and one more above and to the right for the note's outline. */
const GRID_SIZE = 17;
const NOTE: PixelRun[] = [
  [9, 0, 1],
  [9, 1, 2],
  [9, 2, 1],
  [11, 2, 1],
  [9, 3, 1],
  [11, 3, 1],
  [7, 4, 3],
  [6, 5, 4],
  [6, 6, 3],
];
const NOTE_OUTLINE: PixelRun[] = [
  [9, -1, 1],
  [8, 0, 1],
  [10, 0, 1],
  [8, 1, 1],
  [11, 1, 1],
  [8, 2, 1],
  [10, 2, 1],
  [12, 2, 1],
  [7, 3, 2],
  [10, 3, 1],
  [12, 3, 1],
  [6, 4, 1],
  [10, 4, 2],
  [5, 5, 1],
  [10, 5, 1],
  [5, 6, 1],
  [9, 6, 1],
  [6, 7, 3],
];
const ANVIL: PixelRun[] = [
  [0, 8, 15],
  [2, 9, 13],
  [5, 10, 9],
  [6, 11, 6],
  [6, 12, 6],
  [4, 13, 10],
  [3, 14, 12],
  [3, 15, 12],
];

type LogoProps = { size: number };

/** The logo, `size` pixels square on the page. */
export function Logo({ size }: LogoProps) {
  return (
    <svg
      className="logo"
      width={size}
      height={size}
      viewBox={`0 -1 ${GRID_SIZE} ${GRID_SIZE}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g className="logo-note-outline">
        {NOTE_OUTLINE.map(([x, y, width]) => (
          <rect key={`${x},${y}`} x={x} y={y} width={width} height={1} />
        ))}
      </g>
      <g className="logo-note">
        {NOTE.map(([x, y, width]) => (
          <rect key={`${x},${y}`} x={x} y={y} width={width} height={1} />
        ))}
      </g>
      <g className="logo-anvil">
        {ANVIL.map(([x, y, width]) => (
          <rect key={`${x},${y}`} x={x} y={y} width={width} height={1} />
        ))}
      </g>
    </svg>
  );
}

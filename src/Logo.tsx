// The logo: a note above an anvil, drawn on a 16×16 grid of pixels in the look's colours.

/** A run of pixels on one row: x, y and how many. */
type PixelRun = [number, number, number];

const GRID_SIZE = 16;
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
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
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

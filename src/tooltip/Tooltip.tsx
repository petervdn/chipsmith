// The page's own tooltip, in place of the browser's (`title`): the `data-tooltip` of what the mouse
// rests on or the keyboard is on, in a small dark bubble beside it. It knows nothing of what it
// explains.
import { useLayoutEffect, useRef, useState } from 'react';
import { getTooltipPlace } from './tooltip-place.ts';
import { TOOLTIP_ID, useTooltip } from './use-tooltip.ts';
import './Tooltip.css';

/**
 * Shows the tooltip of what the pointer or the keyboard is on, while there is one.
 *
 * @returns The tooltip's element, or null when none shows.
 */
export function Tooltip() {
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const shown = useTooltip();
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!shown || !bubble) {
      setPlace(null);
      return;
    }
    const size = { width: bubble.offsetWidth, height: bubble.offsetHeight };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    setPlace(getTooltipPlace({ target: shown.target, size, viewport }));
  }, [shown]);
  if (!shown) return null;
  return (
    <div
      ref={bubbleRef}
      id={TOOLTIP_ID}
      role="tooltip"
      className={`tooltip${place ? ' is-placed' : ''}`}
      style={place ?? undefined}
    >
      {shown.text}
    </div>
  );
}

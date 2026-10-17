# src/tooltip/

The page's own tooltip, in place of the browser's (`title`): a control's `data-tooltip`, shown when
the mouse rests on it or the keyboard moves to it.

- `Tooltip.css`: the look of Tooltip.tsx
- `Tooltip.tsx`: the bubble, beside what it explains
- `tooltip-place.ts`: where the bubble goes: under, or above at the window's foot, inside the window
- `use-tooltip.ts`: which tooltip shows, from the pointer and the keyboard

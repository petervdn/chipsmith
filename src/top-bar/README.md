# src/top-bar/

The bar at the top of every page: the logo, the tabs with their counts, + New song, and the switch
between light and dark.

- `Logo.css`: the look of Logo.tsx
- `Logo.tsx`: the logo, a note above an anvil in pixels
- `looks.ts`: the two looks, light and dark, and switching between them
- `LookSwitcher.css`: the look of LookSwitcher.tsx
- `LookSwitcher.tsx`: ☾ / ☀ in the top bar, to switch between light and dark
- `TopBar.css`: the look of TopBar.tsx
- `TopBar.tsx`: the bar at the top of every page
- `use-look.ts`: the look the page is in, and stepping to another
- `use-tab-counts.ts`: how many each of the top bar's tabs holds
- `use-top-bar-height.ts`: the bar's height as `--top-bar-height`, for what sticks under it

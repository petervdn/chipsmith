# 0046. The top bar is the window's full width; each page keeps its own width

- Status: accepted
- Date: 2026-10-18

## Context
The top bar's content kept to the page's width: 1,100 px, or 1,600 px on a song's page for the
editor. Going from a list to a song moved the logo, the tabs and the buttons, so what was under the
mouse changed between clicks. The pages' own widths differ on purpose (the editor wide, the lists
medium, the forms and text narrow), and tying the bar to them made every difference show.

## Decision
The top bar's content spans the window, 24 px in from each side (10 px on a phone), on every page.
The pages keep their own widths, centred under it.

## Alternatives
- **One width for every page and the bar** (tried and reverted the same day): the bar stood
  still, but the lists stretched and the narrow pages looked lost at the left of a wide page.
- **The bar at the widest page's width (1,600 px) everywhere.** Stands still too, but on a screen
  between 1,100 and 1,600 px it matches no page.

## Consequences
On a very wide screen the logo and the buttons are far apart, as in most tools. A narrow page is a
centred column under a bar that does not follow it, which reads as intended.

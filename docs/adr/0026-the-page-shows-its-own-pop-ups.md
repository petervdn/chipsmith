# 0026. The page shows its own dialogs and tooltips, never the browser's

- Status: accepted
- Date: 2026-10-17

## Context
The questions asked before a change (delete a guide, remove a track, split a song, cancel a job)
were `window.confirm`, and the tooltips were `title`. The browser draws both in its own look, which
differs from browser to browser and ignores the page's light or dark; a confirm says the address
over the question, and its buttons say only OK and Cancel.

## Decision
The page draws them itself:
- **A question** is `askToConfirm({ question, answer, isDanger })` (`src/stores/confirm-store.ts`),
  which gives a promise of the answer. One dialog (`src/dialog/ConfirmDialog.tsx`, a modal
  `<dialog>`) shows it in a card over a see-through black backdrop, with Cancel and a button that
  says what happens, red when it takes something away. Escape or a tap beside it is no.
- **A tooltip** is a control's `data-tooltip`. One layer (`src/tooltip/`) shows it in a small bubble
  under the control (above at the window's foot) when the mouse rests on it or the keyboard moves to
  it, and describes the control by it (`aria-describedby`) while it shows.

## Alternatives
- **The browser's, as they were.** Nothing to build, but not the page's look.
- **A tooltip component wrapped around each control.** Each place would need a wrapper element and
  its own state; one layer reading an attribute keeps the controls as they are.
- **A dialog per place it is asked**, each with its own state. Every place would hold the same
  open/answer state; one store and one dialog keep it in one place, and an ask reads as one line.

## Consequences
A control whose only content is a symbol (✕, ☆, −) no longer gets its name from `title`: a screen
reader reads the symbol, and the tooltip as its description. A tooltip does not show on a touch
screen, as `title` did not.

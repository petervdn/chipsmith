# src/dialog/

The page's own dialogs, in place of the browser's (`window.confirm`): shown over a see-through black
backdrop, in the page's look.

- `ConfirmDialog.css`: the look of ConfirmDialog.tsx
- `ConfirmDialog.tsx`: the question asked before a change, with Cancel and its answer
- `Dialog.css`: the look of Dialog.tsx, and the buttons the dialogs share
- `Dialog.tsx`: the page's modal dialog: a card over the backdrop, closed by Escape or a tap beside it

/**
 * Copying text to the clipboard. The page is served over plain http on the local network, where
 * phone browsers have no clipboard API, so it falls back to the old way: select a hidden text field
 * and copy.
 */

/**
 * Copies text to the clipboard, with the clipboard API where the page may use it and by selecting a
 * hidden text field otherwise.
 *
 * @param text - The text to copy.
 * @returns Whether it was copied.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall back below */
    }
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  try {
    // eslint-disable-next-line typescript/no-deprecated -- the only way to copy without the clipboard API (plain http)
    return document.execCommand('copy');
  } finally {
    field.remove();
  }
}

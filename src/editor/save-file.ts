/**
 * Where an exported file goes: with the browser's file picker where it has one (desktop Chrome and
 * Edge, on localhost or https), the system's Save dialog asked first, while the tap that asked is
 * still fresh; elsewhere a download. Knows nothing of what the file holds.
 */
import type { ExportFormat } from '../../shared/audio-export.ts';

/** Options of the browser's Save dialog (the File System Access API). */
type SaveFilePickerOptions = {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
};

declare global {
  // eslint-disable-next-line typescript/consistent-type-definitions -- only an interface merges into the DOM's Window
  interface Window {
    /** The browser's Save dialog, where it has one; TypeScript's DOM types do not have it yet. */
    showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

/** Where a file is written once it is made. */
export type FileDestination = {
  /** Whether a place was chosen in the Save dialog; false when the file is downloaded. */
  isChosen: boolean;
  write: (file: Blob) => Promise<void>;
};

/**
 * Asks where a file goes: the Save dialog where the browser has one, else a download. Called from
 * a tap, before the file is made, as the dialog only opens from one.
 *
 * @param name - The name the file is offered under.
 * @param format - Its file type.
 * @returns Where to write it, or null when the Save dialog was cancelled.
 */
export async function chooseFileDestination(
  name: string,
  format: ExportFormat,
): Promise<FileDestination | null> {
  if (!window.showSaveFilePicker) {
    return { isChosen: false, write: async (file) => downloadFile(file, name) };
  }
  let handle: FileSystemFileHandle;
  try {
    handle = await window.showSaveFilePicker({
      suggestedName: name,
      types: [
        { description: format.label, accept: { [format.mediaType]: [`.${format.extension}`] } },
      ],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    throw error;
  }
  return {
    isChosen: true,
    write: async (file) => {
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
    },
  };
}

/** Milliseconds a download's address is kept, for the browser to start reading it. */
const DOWNLOAD_URL_LIFE = 60000;

function downloadFile(file: Blob, name: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFE);
}

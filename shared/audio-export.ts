/**
 * The file types a song is exported to as audio: the page offers them, the server encodes those that
 * are not WAV (render/encode-export.ts). Knows nothing of how either does it.
 */

/** A file type a song can be exported to. */
export type ExportFormat = {
  /** Its name in a route and a choice: `wav`, `flac`, `mp3`. */
  name: string;
  /** What it is called on the page. */
  label: string;
  /** What it is good for, in a few words. */
  about: string;
  /** The ending of a file of it, without the dot. */
  extension: string;
  /** Its media type. */
  mediaType: string;
  /** What ffmpeg is given to encode it, after its input; none for WAV, which the page writes. */
  ffmpegArgs: string[];
};

/** The file types offered, the first chosen at first. */
export const EXPORT_FORMATS: ExportFormat[] = [
  {
    name: 'wav',
    label: 'WAV',
    about: 'uncompressed, 16-bit',
    extension: 'wav',
    mediaType: 'audio/wav',
    ffmpegArgs: [],
  },
  {
    name: 'flac',
    label: 'FLAC',
    about: 'lossless, about half the size',
    extension: 'flac',
    mediaType: 'audio/flac',
    ffmpegArgs: ['-c:a', 'flac', '-compression_level', '8', '-f', 'flac'],
  },
  {
    name: 'mp3',
    label: 'MP3',
    about: '320 kbps, small, to share',
    extension: 'mp3',
    mediaType: 'audio/mpeg',
    ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '320k', '-f', 'mp3'],
  },
];

/**
 * Returns the export file type of a name.
 *
 * @param name - The type's name (`flac`).
 * @returns The type, or undefined when none has that name.
 */
export function getExportFormat(name: string): ExportFormat | undefined {
  return EXPORT_FORMATS.find((format) => format.name === name);
}

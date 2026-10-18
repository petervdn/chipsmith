/**
 * The file types a song is exported to as audio: the page offers them, the server encodes those that
 * are not WAV (render/encode-export.ts). Knows nothing of how either does it.
 */

/** Bytes a second of 16-bit stereo audio at 44.1 kHz, the clips' rate: a WAV of the mix. */
const WAV_BYTES_PER_SECOND = 44100 * 2 * 2;
/** Bytes a second of MP3 at 320 kbps. */
const MP3_BYTES_PER_SECOND = 320000 / 8;
/**
 * The share of a WAV's size a FLAC of chip music takes, fewest and most: the clips' FLACs take 0.1
 * to 0.33 (10th to 90th percentile), a mix of several channels towards the top.
 */
const FLAC_SHARE = { fewest: 0.15, most: 0.4 };

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
  /** About how many bytes a second of it takes, fewest and most; the same where it does not vary. */
  bytesPerSecond: { fewest: number; most: number };
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
    bytesPerSecond: { fewest: WAV_BYTES_PER_SECOND, most: WAV_BYTES_PER_SECOND },
    ffmpegArgs: [],
  },
  {
    name: 'flac',
    label: 'FLAC',
    about: 'lossless',
    extension: 'flac',
    mediaType: 'audio/flac',
    bytesPerSecond: {
      fewest: WAV_BYTES_PER_SECOND * FLAC_SHARE.fewest,
      most: WAV_BYTES_PER_SECOND * FLAC_SHARE.most,
    },
    ffmpegArgs: ['-c:a', 'flac', '-compression_level', '8', '-f', 'flac'],
  },
  {
    name: 'mp3',
    label: 'MP3',
    about: '320 kbps',
    extension: 'mp3',
    mediaType: 'audio/mpeg',
    bytesPerSecond: { fewest: MP3_BYTES_PER_SECOND, most: MP3_BYTES_PER_SECOND },
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

/**
 * A song's mix, rendered by the page as a WAV, sent to the server to be encoded to another export
 * file type (`POST /api/encode/<type>`). Knows nothing of how the mix was made.
 */
import { useMutation } from '@tanstack/react-query';
import type { ExportFormat } from '../../shared/audio-export.ts';
import { getErrorMessage } from './request.ts';

/** A WAV to encode, and the file type to encode it to. */
type Encoding = { wav: Uint8Array<ArrayBuffer>; format: ExportFormat };

/**
 * Returns the mutation that encodes a WAV on the server.
 *
 * @returns The mutation; it gives the encoded file.
 */
export function useEncodeAudio() {
  return useMutation({ mutationFn: encodeAudio });
}

/**
 * Sends a WAV to the server and gives back the file it encoded.
 *
 * @param encoding - What is encoded.
 * @param encoding.wav - The WAV file's bytes.
 * @param encoding.format - The file type to encode it to.
 * @returns The encoded file.
 */
async function encodeAudio({ wav, format }: Encoding): Promise<Blob> {
  const response = await fetch(`/api/encode/${encodeURIComponent(format.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: new Blob([wav], { type: 'audio/wav' }),
  });
  if (!response.ok) {
    const answer: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(answer, response));
  }
  return response.blob();
}

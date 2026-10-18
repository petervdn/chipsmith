/**
 * The clips from the server: the pool, changing a clip's status or a variation's label, a clip's
 * notes for the note grid, a take made by transposing a clip or from its notes as edited, and
 * opening its .fur in Furnace.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ClipListing, ClipOpened, TakeMade } from '../../shared/api.types.ts';
import type { Status } from '../../shared/catalogue.schema.ts';
import type { ChannelRow, ClipNotes } from '../../shared/clip-notes.schema.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/**
 * Reads the clip pool from the server.
 *
 * @returns The query of the pool's clip listings.
 */
export function useClips() {
  return useQuery({
    queryKey: getQueryKey({ type: 'clips' }),
    queryFn: () => requestJson<ClipListing[]>('/api/clips'),
  });
}

/**
 * Changes a clip's status on the server; the pool is read again after.
 *
 * @returns The mutation, called with the clip's id (`clipId`) and its new `status`.
 */
export function useSetClipStatus() {
  return useMutation({
    mutationFn: ({ clipId, status }: { clipId: string; status: Status }) =>
      sendJson<ClipListing>(`/api/clips/${encodeURIComponent(clipId)}`, 'PATCH', { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) }),
  });
}

/**
 * Renames a variation (docs/adr/0036); the pool is read again after.
 *
 * @returns The mutation, called with the clip's id (`clipId`) and its new `variationLabel`.
 */
export function useSetVariationLabel() {
  return useMutation({
    mutationFn: ({ clipId, variationLabel }: { clipId: string; variationLabel: string }) =>
      sendJson<ClipListing>(`/api/clips/${encodeURIComponent(clipId)}`, 'PATCH', {
        variationLabel,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) }),
  });
}

/**
 * Makes a take of a clip transposed by semitones (docs/adr/0037), rendered on the server; the pool
 * is read again before it settles, so the take is there to be put in a block.
 *
 * @returns The mutation, called with the clip's id (`clipId`), the song it is asked in (`songId`)
 * and how far to move it (`semitones`); it gives the take's id.
 */
export function useTransposeClip() {
  return useMutation({
    mutationFn: async ({
      clipId,
      songId,
      semitones,
    }: {
      clipId: string;
      songId: string;
      semitones: number;
    }) => {
      const made = await sendJson<TakeMade>(
        `/api/clips/${encodeURIComponent(clipId)}/transpose`,
        'POST',
        { song: songId, semitones },
      );
      await queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) });
      return made.clipId;
    },
  });
}

/**
 * Reads a clip's notes for the note grid: each pitched channel that plays, as its run of rows.
 *
 * @param clipId - The clip.
 * @returns The query of its notes.
 */
export function useClipNotes(clipId: string) {
  return useQuery({
    queryKey: getQueryKey({ type: 'clipNotes', clipId }),
    queryFn: () => requestJson<ClipNotes>(`/api/clips/${encodeURIComponent(clipId)}/notes`),
  });
}

/**
 * Makes a take of a clip from one channel's rows as the note grid edited them (docs/adr/0037),
 * rendered on the server; the pool is read again before it settles.
 *
 * @returns The mutation, called with the clip's id (`clipId`), the song it is edited in (`songId`),
 * the channel and its rows; it gives the take's id.
 */
export function useSaveNotes() {
  return useMutation({
    mutationFn: async ({
      clipId,
      songId,
      channel,
      rows,
    }: {
      clipId: string;
      songId: string;
      channel: number;
      rows: ChannelRow[];
    }) => {
      const made = await sendJson<TakeMade>(
        `/api/clips/${encodeURIComponent(clipId)}/notes`,
        'POST',
        { song: songId, channel, rows },
      );
      await queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) });
      return made.clipId;
    },
  });
}

/**
 * Asks the server to open a copy of a clip's .fur file in the Furnace app on its computer.
 *
 * @returns The mutation, called with the clip's id.
 */
export function useOpenClipInFurnace() {
  return useMutation({
    mutationFn: (clipId: string) =>
      sendJson<ClipOpened>(`/api/clips/${encodeURIComponent(clipId)}/open`, 'POST', null),
  });
}

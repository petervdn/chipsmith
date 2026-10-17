/** The clips from the server: the pool, and changing a clip's status. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ClipListing } from '../../shared/api.types.ts';
import type { Status } from '../../shared/catalogue.types.ts';
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

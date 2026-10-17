/** The clips from the server: the pool, and changing a clip's status. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ClipListing } from '../../shared/api.types.ts';
import type { Status } from '../../shared/catalogue.types.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/** The clip pool. */
export function useClips() {
  return useQuery({
    queryKey: getQueryKey({ type: 'clips' }),
    queryFn: () => requestJson<ClipListing[]>('/api/clips'),
  });
}

/** Changes a clip's status; the pool is read again. */
export function useSetClipStatus() {
  return useMutation({
    mutationFn: ({ clipId, status }: { clipId: string; status: Status }) =>
      sendJson<ClipListing>(`/api/clips/${encodeURIComponent(clipId)}`, 'PATCH', { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getQueryKey({ type: 'clips' }) }),
  });
}

/** The references from the server (Furnace's demo songs), and writing what the user hears in one. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReferenceListing } from '../../shared/api.types.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/**
 * Reads the references from the server.
 *
 * @returns The query of the references, by name.
 */
export function useReferences() {
  return useQuery({
    queryKey: getQueryKey({ type: 'references' }),
    queryFn: () => requestJson<ReferenceListing[]>('/api/references'),
  });
}

/**
 * Writes a reference's notes; the server's answer replaces the reference in the cached list.
 *
 * @returns The mutation, called with the reference's id (`referenceId`) and its `notes`.
 */
export function useSaveReferenceNotes() {
  return useMutation({
    mutationFn: ({ referenceId, notes }: { referenceId: string; notes: string }) =>
      sendJson<ReferenceListing>(`/api/references/${encodeURIComponent(referenceId)}`, 'PATCH', {
        notes,
      }),
    onSuccess: (changed) => {
      queryClient.setQueryData<ReferenceListing[]>(
        getQueryKey({ type: 'references' }),
        (listings) =>
          listings?.map((listing) =>
            listing.reference.id === changed.reference.id ? changed : listing,
          ),
      );
    },
  });
}

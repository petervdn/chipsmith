/** The saved structures from the server, and making, changing and deleting one; each answers with the list. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Structure, StructureDraft } from '../../shared/structure.schema.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson, sendJson } from './request.ts';

/**
 * Reads the saved structures.
 *
 * @returns The query of the structures, sorted by name.
 */
export function useStructures() {
  return useQuery({
    queryKey: getQueryKey({ type: 'structures' }),
    queryFn: () => requestJson<Structure[]>('/api/structures'),
  });
}

/**
 * Saves a structure: a new one, or changes to a saved one. The server's list becomes the cached one.
 *
 * @returns The mutation, called with the structure's id (`structureId`, null for a new one) and its
 *   name and sections (`draft`).
 */
export function useSaveStructure() {
  return useMutation({
    mutationFn: ({ structureId, draft }: { structureId: string | null; draft: StructureDraft }) =>
      structureId
        ? sendJson<Structure[]>(
            `/api/structures/${encodeURIComponent(structureId)}`,
            'PATCH',
            draft,
          )
        : sendJson<Structure[]>('/api/structures', 'POST', draft),
    onSuccess: keepStructures,
  });
}

/**
 * Deletes a saved structure. The server's list becomes the cached one.
 *
 * @returns The mutation, called with the structure's id.
 */
export function useDeleteStructure() {
  return useMutation({
    mutationFn: (structureId: string) =>
      sendJson<Structure[]>(`/api/structures/${encodeURIComponent(structureId)}`, 'DELETE', null),
    onSuccess: keepStructures,
  });
}

/**
 * Keeps the server's list of structures as the cached one.
 *
 * @param structures - The structures the server answered with.
 */
function keepStructures(structures: Structure[]): void {
  queryClient.setQueryData(getQueryKey({ type: 'structures' }), structures);
}

/** The check of the programs the app calls (config/programs.ts): read once, and run again on request. */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ProgramCheck } from '../../shared/api.types.ts';
import { getQueryKey, queryClient } from './client.ts';
import { requestJson } from './request.ts';

/**
 * Reads the programs the app calls, as the server last checked them.
 *
 * @returns The query of the programs' checks.
 */
export function usePrograms() {
  return useQuery({
    queryKey: getQueryKey({ type: 'programs' }),
    queryFn: () => requestJson<ProgramCheck[]>('/api/programs'),
    staleTime: Infinity,
  });
}

/**
 * Has the server check the programs again (after installing one or changing a setting); its answer
 * becomes the cached checks.
 *
 * @returns The mutation, called with nothing.
 */
export function useCheckProgramsAgain() {
  return useMutation({
    mutationFn: () => requestJson<ProgramCheck[]>('/api/programs', { method: 'POST' }),
    onSuccess: (checks) => queryClient.setQueryData(getQueryKey({ type: 'programs' }), checks),
  });
}
